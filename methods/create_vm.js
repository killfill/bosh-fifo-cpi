
function check_if_vm_would_succeed(fifo, data, cb) {
	//Callbacks hell...

	//Check for the dataset
	fifo.send('datasets').get(data.dataset, function(err, res) {
		if (err || res.statusCode != 200)
			return cb('Cloud not get dataset: ' + res.statusCode)


		//Check for the network
		fifo.send('networks').get(data.config.networks.net0, function(err, res) {
			if (err || res.statusCode != 200)
				return cb('Cloud not get network: ' + res.statusCode)


			//Check for the package
			fifo.send('packages').get(data.package, function(err, res) {
				if (err || res.statusCode != 200)
					return cb('Cloud not get package: ' + res.statusCode)


				//Dry run
				fifo.send('vms/dry_run').put({body: data}, function(err, res) {
					if (err || res.statusCode > 300)
						return cb(err || res.body || res.statusCode)

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

module.exports = function(fifo, args, response) {
	var directorUUID = args[0],
		dataset = args[1],
		resourceProperty = args[2],
		networkProperty = args[3]
		credentials = args[5]

	//IP assign type
	var type = networkProperty.bosh.type

	//For test propouses
	if (type === 'fake') {
		return fake_create_vm_response(networkProperty.bosh.ip, fifo, response)
	}

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
			alias: 'fifo_cpi_' + new Date().getTime()
		},
	}

	if (networkProperty.bosh.dns)
		data.config.resolvers = networkProperty.bosh.dns

	if (credentials.bosh.password)
		data.bosh_pass = credentials.bosh.password

	//Test the VM to catch up some errors, before actually creating the vm...
	check_if_vm_would_succeed(fifo, data, function(error) {

		if (error)
			return response({
				result: null,
				log: 'VM creation would not succeed. Code: ' + error,
				error: {
					type: 'Bosh::Clouds::VMCreationFailed',
					message: 'Would not succeed. Error: ' + error,
					ok_to_retry: false
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

			response({
				error: null,
				log: 'create_vm ' + newVm,
				result: newVm
			})
		})
	})


}
