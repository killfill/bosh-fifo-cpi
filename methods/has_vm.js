
module.exports = function(fifo, args, response) {
	var uuid = args[0]

	fifo.send('vms').get(uuid, function(err, res) {

		//Errors
		if (err || res.statusCode >= 500) {
			return response({
				result: null,
				log: 'has_vm failed. ' + uuid,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err && err.message || res.statusCode.toString(),
					ok_to_retry: false
				}
			})
		}

		var exists = res.statusCode == 200,
			isSane = exists && res.body.state.indexOf('fail') < 0 && res.body.state.indexOf('delete') < 0

		if (exists && isSane)
			response({
				result: true,
				log: 'VM does exists',
				error: null
			})

		else
			response({
				result: false,
				log: 'VM does not exists: exists: ' + exists + '. isSane: ' + isSane ,
				error: null
			})

	})
}
