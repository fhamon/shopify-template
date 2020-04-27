const findUsedJsFiles = (grunt) => {
	const file = grunt.file.read('./snippets/js.liquid', 'utf8');
	const regex = /'([a-zA-Z\-_]*.js)' \| asset_url/gm;

	let jsFiles = [];
	let m;
	while ((m = regex.exec(file)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		jsFiles.push(`./assets/js/**/${m[1]}`);
	}

	return jsFiles;
};

module.exports = function (grunt) {
	const path = require('path');
	const env = grunt.option('env') || 'default';

	// Files
	let shopifyConfig = grunt.file.readJSON('./config.json', 'utf8')[env];
	const jsFiles = findUsedJsFiles(grunt);

	const banner = '/* <%= theme.theme_name %> - <%= pkg.version %> - <%= grunt.template.today("dd-mm-yyyy") %> */';

	grunt.initConfig({
		theme: grunt.file.readJSON('./config/settings_schema.json', 'utf8')[0],
		pkg: grunt.file.readJSON('package.json'),
		shopify: {
			options: {
				myshopify: shopifyConfig.myshopify,
				api_key: shopifyConfig.api_key,
				theme_id: shopifyConfig.theme_id,
				password: shopifyConfig.password
			}
		},
		less: {
			development: {
				options: {
					banner: banner,
					compress: true
				},
				files: {
					'./assets/theme.min.css': './assets/css/theme.less'
				}
			}
		},
		jshint: {
			files: jsFiles,
			options: grunt.file.readJSON('jshint.json')
		},
		uglify: {
			options: {
				banner: banner
			},
			dist: {
				files: {
					'./assets/theme.min.js': ['./assets/theme.js']
				}
			}
		},
		concat: {
			options: {
				separator: '\n'
			},
			dist: {
				src: jsFiles,
				dest: './assets/theme.js'
			}
		},
		watch: {
			js: {
				files: ['./assets/js/**/*.js'],
				tasks: ['build', 'shopify']
			},
			css: {
				files: ['./assets/css/**/*.less'],
				tasks: ['less', 'shopify']
			},
			liquid: {
				files: ['./**/*.liquid'],
				tasks: ['shopify']
			},
			options: {
				spawn: false
			}
		}
	});

	const tasks = grunt.file.expand({ filter: 'isFile', cwd: 'tasks' }, ['*']);

	tasks.forEach(task => {
		require(`./tasks/${task}`)(grunt);
	});

	grunt.event.on('watch', function (action, filepath) {
		grunt.config.set('shopify.options.files', filepath.replace(/\\/g, '/'));
		grunt.config.set('shopify.options.mode', action);
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['watch']);
	grunt.registerTask('build', ['less', 'concat', 'uglify']);
	grunt.registerTask('deploy', ['watch']);
	grunt.registerTask('deploy:prod', ['watch']);
	grunt.registerTask('sync', ['shopify:sync']);
	grunt.registerTask('upload', ['shopify:upload']);
	grunt.registerTask('download', ['shopify:download']);
};