#!/usr/bin/env node

//Setup the HOME env, so nfifo knows where to read the config file with the credentials.
//Ruby popen3 is not setting it...
if (!process.env.HOME)
	process.env.HOME = '/var/vcap'

var nFifo = require('nfifo'),
	fs = require('fs'),
	uuid = require('uuid')

module.exports = {

	_method: null,
	_args: null,

	method: function(m) {
		this._method = m 
		return this
	},

	withArguments: function(args) {
		this._args = args
		return this
	},

	end: function(cb) {

		try {
			var runner = require('./methods/' + this._method)
		}
		catch (e) {
			return cb({
				result: null,
				log: 'Unable to run ' + this._method + ': ' + e.message,
				error: {
					type: 'Bosh::Clouds::NotSupported',
					message: 'Unknow method ' + this._method,
					ok_to_retry: false
				}
			})
		}


		//Connect and run!
		nFifo.connect(function(fifo) {

			runner(fifo, this._args, cb)

		}.bind(this))

		return this
	}

}


