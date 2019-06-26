
module.exports = {

	default: {
		description: "Perform all necessary tasks to build distribution files",
		tasks: [
			'clean',
			'babel',
			'uglify'
		]
	},

};