//TODO
module.exports = function(fifo, args, response) {
	var id = args[0]

	response({
		error: null,
		log: 'set_vm_metadata_result ' + id + '. Interesting.. we could use the fifo metadata... What is this for?',
		result: 'set_vm_metadata_result'
	})
}