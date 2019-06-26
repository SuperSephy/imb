"use strict";

module.exports = {

	options: {
		banner: 	'/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
		footer: 	'\n',
		beautify: 	false,
		sourceMap:	true
	},

	connections: {
		files: [{
			expand: true,
			cwd: 'dist',
			src: '*.js',
			dest: 'dist',
			ext: '.min.js'
		}]
	}

};
