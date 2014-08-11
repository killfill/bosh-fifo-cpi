var fs = require('fs')

function check_if_vm_would_succeed(fifo, data, cb) {
	//Callbacks hell...

	//Check for the dataset
	fifo.send('datasets').get(data.dataset, function(err, res) {
		if (err || res.statusCode != 200)
			return cb('Cloud not get dataset: ' + res.statusCode)


		//Check for the network
		if (!data.config.networks.net0)
			return cb('No network was specified')

		fifo.send('networks').get(data.config.networks.net0, function(err, res) {
			if (err || res.statusCode != 200)
				return cb('Cloud not get network: ' + res.statusCode)


			//Check for the package
			fifo.send('packages').get(data.package, function(err, res) {
				if (err || res.statusCode != 200)
					return cb('Cloud not get package: ' + res.statusCode)


				//Dry run.
				fifo.send('vms/dry_run').put({body: data}, function(err, res) {
					if (err || res.statusCode > 300)
						return cb(err || res.body || res.statusCode, true)

					cb(null)
				})
			})
		})
	})
}

function fake_create_vm_response(ip, fifo, response) {
	//Seach the VM by IP, and return its uuid


	fifo.send('vms').get(function(err, res) {

		for (var i=0; i < res.body.length; i++) {

			var vm = res.body[i],
				ips = vm.config.networks.map(function(n) {return n.ip})

			if (ips.indexOf(ip) > -1)
				return response({
					result: vm.uuid,
					error: null,
					log: 'Fake: returning existing uuid of vm with IP ' + ip
				})

		}

		response({
			result: null,
			log: 'Fake: Could not find vm with IP ' + ip,
			error: {
				type: 'Bosh::Clouds::CloudError',
				message: 'Fake: Could not find vm with IP ' + ip,
				ok_to_retry: false
			},
		})

	})
}

function waitForVM(fifo, newVm, cb) {


	function loop() {

		fifo.send('vms').get(newVm, function(err, res) {
			if (err) return cb(err)
			if (res.statusCode != 200) return cb(res.statusCode)

			if (res.body.state.indexOf('fail') > -1)
				return cb(res.body.state)

			if (res.body.state === 'running')
				return cb()

			//There is a change the vm is stuck. Just let bosh timeout.
			setTimeout(loop, 1000)

		})
	}

	loop()

}


module.exports = function(fifo, args, response) {
	var agentId = args[0], //Agent uuid assigned by bosh. This should probably go into /var/vcap/bosh/dummy-cpi-agent-env.json:agent_id ...
		dataset = args[1],
		resourceProperty = args[2],
		networkProperty = args[3]
		credentials = args[5]

	//IP assign type
	var type = networkProperty.bosh.type

	//For test propouses
	if (type === 'fake')
		return fake_create_vm_response(networkProperty.bosh.ip, fifo, response)

	if (type !== 'dynamic')
		return response({
			result: null,
			log: 'Fifo cannot create a VM with a specific IP. use dynamic assigning',
			error: {
				type: 'Bosh::Clouds::CloudError',
				message: 'Fifo cannot create a VM with a specific IP',
				ok_to_retry: false
			}
		})

	var data = {
		dataset: dataset,
		package: resourceProperty.instance_type,
		config: {
			networks: {
				net0: networkProperty.bosh.cloud_properties.net_id
			},
			alias: 'bosh-' + agentId.slice(0,6),
			metadata: {
				agent_id: agentId,
				'user-script': fs.readFileSync(__dirname + '/../bin/setup-bosh-config.sh', 'utf-8')
			}
		}
	}

	if (networkProperty.bosh.dns)
		data.config.resolvers = networkProperty.bosh.dns

	if (credentials.bosh && credentials.bosh.password)
		data.bosh_pass = credentials.bosh.password

	//Test the VM to catch up some errors, before actually creating the vm...
	check_if_vm_would_succeed(fifo, data, function(error, please_try) {

		if (error)
			return response({
				result: null,
				log: 'VM creation would not succeed. Code: ' + error,
				error: {
					type: 'Bosh::Clouds::VMCreationFailed',
					message: 'Would not succeed. Error: ' + error,
					ok_to_retry: please_try === true
				}
			})

		fifo.send('vms').post({body: data}, function(err, res) {

			if (err || res.statusCode != 303)
				return response({
					result: null,
					log: 'Could not create VM',
					error: {
						type: 'Bosh::Clouds::VMCreationFailed',
						message: err || res.statusCode,
						ok_to_retry: false
					}
				})

			var newVm = res.headers.location.split('/').pop()

			//Show the VM in yellow
			fifo.send('vms').put({args: [newVm, 'metadata', 'jingles'], body: {color: '#fbd75b'}}, function() {})

			//Wait until the VM is ready. If not, bosh will trigger a metadata update, high chance the vm is not on the hypervisor jet, and that call assumes its there...
			waitForVM(fifo, newVm, function(err) {

				if (err)
					return response({
						error: {
							type: 'Bosh::Clouds::CloudError',
							message: err.toString(),
							ok_to_retry: false
						},
						log: 'create_vm failed: ' + err.toString(),
						result: null
					})

				response({
					error: null,
					log: 'create_vm ' + newVm,
					result: newVm
				})

			})


		})
	})

}
