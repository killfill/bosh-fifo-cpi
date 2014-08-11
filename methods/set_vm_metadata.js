module.exports = function(fifo, args, response) {
	var vm = args[0],
		hash = args[1]

	var n = Object.keys(hash).length


	function cb(err, res) {

		if (err || res.statusCode >= 300)
			return response({
				result: null,
				log: 'Could not set metadata ' + (err && err.message || res.body || res.statusCode),
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: 'Could not set metadata ' + (err && err.message || res.body || res.statusCode),
					ok_to_retry: false
				}
			})

		if (--n<=0)
			return response({
				result: 'Metadata setted up',
				error: null,
				log: 'Metadata setted up'
			})
	}


	Object.keys(hash).forEach(function(k) {
		// var obj = {args: [vm, 'metadata', 'bosh']} //Fifo metadata
		var obj = {args: vm, body: {config: {metadata: {}}}} //Use smartos metadata, so the values can be read from inside the VM.
		obj.body.config.metadata[k] = hash[k]
		fifo.send('vms').put(obj, cb)
	})

}