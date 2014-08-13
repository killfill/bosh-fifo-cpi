
module.exports = function(fifo, args, response) {
	var stemcell = args[0]

	//Lets ignore stemcell deletion :)
	return response({
		result: stemcell,
		log: 'Ignoring delete stemcell ' + stemcell,
		error: null
	})

}