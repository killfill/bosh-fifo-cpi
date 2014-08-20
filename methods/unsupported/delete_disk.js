module.exports = function(fifo, args, response) {
	var diskId = args[0]

	//All VMs has already a vm disk, as defined in the package (flaviour) return a stub
	return response({
		result: diskId,
		log: 'Ignoring disk_delete',
		error: null
	})

}

