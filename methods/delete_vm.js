
module.exports = function(fifo, args, response) {
	var uuid = args[0]

	fifo.send('vms').delete(uuid, function(err, res) {
		if (err || res.statusCode != 204)
			return response({
				result: null,
				log: 'delete_vm failed. ' + uuid,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err || res.statusCode,
					ok_to_retry: false
				}
			})

		response({
			error: null,
			log: 'delete_vm ' + uuid,
			result: uuid
		})
	})

}