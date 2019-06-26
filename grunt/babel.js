
module.exports = {

	options: {
		sourceMap: true,
		presets: [
			'@babel/preset-env'
		]
	},

	connections: {
		files: [{
			expand: true,
			cwd: 'src/',
			src: ['**/*.js'],
			dest: 'dist/'
		}]
	}

};