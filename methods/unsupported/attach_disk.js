module.exports = function(fifo, args, response) {
	var vmUUID = args[0],
		diskID = args[1]

	//All VMs has already a vm disk, as defined in the package (flaviour) return a stub
	return response({
		result: 'hmmm',
		log: 'Ignoring attach_disk ',
		error: null
	})

}

