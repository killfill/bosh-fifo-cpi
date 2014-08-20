
module.exports = function(fifo, args, response) {
	var size = args[0],
		vmUUID = args[1]

	//All VMs has already a persistent disk, as defined in the package (flaviour) so just return a stub
	//CPI should update the metadata on attach_disk, bosh-agent does re-read its configu on mount_disk: https://groups.google.com/a/cloudfoundry.org/forum/#!topic/bosh-users/sWO7sQmrvgg
	//To by pass all that just return 'disk-vmUUID' and pre-setup that when generating the dummy.json agent config.
	//TODO: i should external cpi will let me select mecanism to reload config. probably need a metadata server somewhere...
	return response({
		result: 'vol-' + vmUUID,
		log: 'Ignoring disk_create',
		error: null
	})

}

