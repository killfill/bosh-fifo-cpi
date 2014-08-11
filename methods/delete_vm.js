
module.exports = function(fifo, args, response) {
	var uuid = args[0]

	fifo.send('vms').delete(uuid, function(err, res) {
		if (err)
			return response({
				result: null,
				log: 'delete_vm failed. ' + uuid,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err.message,
					ok_to_retry: false
				}
			})

		switch (res.statusCode) {
			case 204:
				response({
					error: null,
					log: 'delete_vm ' + uuid,
					result: uuid
				})
				break

			case 404:
				response({
					error: null,
					log: 'VM does not exists, will ignore delete request ' + uuid,
					result: uuid
				})
				break

			default:
				response({
					result: null,
					log: 'delete_vm failed. ' + uuid,
					error: {
						type: 'Bosh::Clouds::CloudError',
						message: res.statusCode.toString(),
						ok_to_retry: false
					}
				})

		}

	})

}