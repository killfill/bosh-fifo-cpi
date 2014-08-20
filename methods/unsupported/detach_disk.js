
module.exports = function(fifo, args, response) {
	var vmUUID = args[0],
		diskId = args[1]

	//All VMs has already a vm disk, as defined in the package (flaviour) return a stub
	return response({
		result: 'hmmm',
		log: 'Ignoring detach_disk ',
		error: null
	})

}

