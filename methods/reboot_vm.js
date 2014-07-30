
module.exports = function(fifo, args, response) {
	var uuid = args[0]

	fifo.send('vms').put({args: uuid, body: {action: 'reboot'}}, function(err, res) {
		if (err || res.statusCode != 204)
			return response({
				result: null,
				log: 'reboot_vm failed. ' + uuid,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err || res.statusCode,
					ok_to_retry: false
				}
			})

		response({
			error: null,
			log: 'reboot_vm ' + uuid,
			result: uuid
		})
	})
}