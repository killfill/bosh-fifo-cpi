
module.exports = function(fifo, args, response) {
	var uuid = args[0]

	fifo.send('vms').get(uuid, function(err, res) {

		//Errors
		if (err || res.statusCode >= 500) {
			return response({
				result: null,
				log: 'vm_get failed. ' + uuid,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err && err.message || res.statusCode.toString(),
					ok_to_retry: false
				}
			})
		}

		if (res.statusCode == 404)
			return response({
				result: null,
				log: 'vm_get failed. VM not found. ' + uuid,
				error: {
					type: 'Bosh::Clouds::VMNotFound',
					message: 'Could not find ' + uuid,
					ok_to_retry: true
				},

			})

		//Lets interprate that if the vm has state failed. the vm is not really there.
		//Probably fifo just could not create the vm.
		if (res.body.state.indexOf('fail') > -1)
			return response({
				result: null,
				log: 'vm_get failed. The machine has state ' + res.body.state,
				error:  {
					type: 'Bosh::Clouds::CloudError',
					message: 'VM is in failed state',
					ok_to_retry: false
				}
			})


		//In case the ip has not been set up jet in the vm (i.e. when dataset is been tranfered to the hypervisor) use the one that has been mapped.
		var ip = res.body.config.networks[0].ip || Object.keys(res.body.network_mappings)[0]
		return response({
			error: null,
			log: 'vm_get ' + uuid,
			result: {
				private_ip_address: ip,
				floating_ip_address: ip,
				name: res.body.config.alias
			}
		})

	})
}
