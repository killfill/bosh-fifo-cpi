

function uploadZvol(fifo, fileName, uuid, response){

	var file = fs.createReadStream(fileName)

	var remote = fifo.send('datasets').put({json: false, headers: {'content-type': 'application/x-gzip'}, args: [uuid, 'dataset.gz']}, function(err, res) {

		if (err)
			return response({
				result: null,
				log: 'Failed to upload stemcell: ' + err.message,
				error: {
					type: 'Bosh::Clouds::CloudError',
					message: err.message,
					ok_to_retry: false
				}
			})

		if (res.statusCode == 204) {
			return response({
				result: uuid,
				log: 'Dataset image uploaded ok. ' + uuid,
				error: null
			})
		}

		response({
			result: null,
			log: 'Could not upload zvol to dataset' + uuid  + ': ' + res.statusCode,
			error: {
				type: 'Bosh::Clouds::CloudError',
				message: 'Could not upload zvol. http status code ' + res.statusCode,
				ok_to_retry: false
			}
		})

	})

	file.pipe(remote)

}

//Return a fifo/smartos manifest, based on the bosh stemcell config
function createManifest(config, opts) {
	var mani = {
		uuid: '',
		name: '',
		version: '',
		published_at: new Date().toISOString(),
		type: 'zvol',
		os: 'linux',
		files: [
			{
				sha1: 'sha_is_not_validated_anyway',
				size: 0,
				compression: 'gzip'
			}
		],
		description: '',
		homepage: 'https://docs.project-fifo.net/',
		urn: '',
		requirements: {
			networks: [{
				name: 'net0',
				description: 'public'
			}]
		},
		creator_name: 'bosh_fifo_cpi',
		creator_uuid: '03a25d5036448638680fdc8b1898c04a',
		nic_driver: 'virtio',
		disk_driver: 'virtio',
		cpu_type: 'host',
	}

	mani.name = config.name,
	mani.version = config.version,
	mani.description = 'Bosh Stemcell for FiFo',
	mani.urn = 'sdc:bosh:' + config.name + ':' + config.version
	mani.uuid = opts.uuid
	mani.files[0].size = opts.size

	return mani

}


module.exports = function(fifo, args, response) {

	var fileName = args[0],
		config = args[1]



	//Check the state of the dataset wanted to be uploaded
	fifo.send('datasets').get(function(err, res, body) {

		var existingDataset = false
		body.forEach(function(dataset) {
			if (dataset.name == config.name && dataset.version == config.version)
				existingDataset = dataset
		})

		//if the semcell already exists, be nice and return its uuid
		if (existingDataset && existingDataset.status != 'pending')
			return response({
				result: existingDataset.dataset,
				log: 'Image already exists:' + existingDataset.name + ' ' + existingDataset.version + '(' + existingDataset.status + '). Returning uuid ' + existingDataset.dataset,
				error: null
			})

		//If manifest is in pending state, send just the zvol.
		if (existingDataset && existingDataset.status == 'pending')
			return uploadZvol(fifo, fileName, existingDataset.dataset, response)

		var manifest = createManifest(config, {
			uuid: uuid.v4(), //random uuid
			size: Math.ceil(fs.statSync(fileName).size/1024/1024) //We need to specify the image size [MB]
		})

		//Upload the manifest
		fifo.send('datasets').post({args: manifest.uuid, body: manifest}, function(err, res, body) {

			if (res.statusCode != 201)
				return response({
					result: null,
					log: 'Could not create manifest ' + (err || res.statusCode),
					error: {
						type: 'Bosh::Clouds::CloudError',
						message: 'Could not create manifest ' + (err || res.statusCode),
						ok_to_retry: false
					}
				})

			uploadZvol(fifo, fileName, manifest.uuid, response)

		})

	})

}