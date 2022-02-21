'use strict';

module.exports = function(grunt){
	require('time-grunt')(grunt);
	require('load-grunt-tasks')(grunt);

	/* eslint-disable-next-line no-unused-vars */
	const config = {
		build: 'build'
	};

	grunt.initConfig({
		config: config,
		browserSync: {
			options: {
				background: true,
				open: false
			},
			dev: {
				options: {
					files: ['app/**/*'],
					port: 9000,
					proxy: 'localhost:3000'
				},
			}
		},
		wiredep: {
			app: {
				ignorePath: '../public/',
				src: ['app/views/bundle.ejs'],
			},
			options: {
				directory: 'app/public/bower_components'
			}
		},
		run: {
			clean: {
				cmd: 'rm',
				args: ['-rf', '<%= config.build %>/']
			},
			start: {
				cmd: 'npm',
				args: ['run', 'nodemon']
			}
		},
		useminPrepare: {
			options: {
				dest: '<%= config.build %>/public'
			},
			html: [
				'app/views/bundle.ejs'
			]
		},
		usemin: {
			css: ['<%= config.build %>/public/styles/{,*/}*.css'],
			html: ['<%= config.build %>/views/{,*/}*.ejs'],
			options: {
				assetsDirs: ['<%= config.build %>/public/images'],
			}
		},
		htmlmin: {
			dist: {
				options: {
					// removeCommentsFromCDATA: true,
					// collapseWhitespace: true,
					// collapseBooleanAttributes: true,
					// removeAttributeQuotes: true,
					// removeRedundantAttributes: true,
					// useShortDoctype: true,
					// removeEmptyAttributes: true,
					// removeOptionalTags: true
				},
				files: [{
					expand: true,
					cwd: 'app/public',
					src: '*.html',
					dest: '<%= config.build %>/public'
				}]
			}
		},
		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: 'app/public/images',
					src: '{,*/}*.{gif,ico,jpeg,jpg,png}',
					dest: '<%= config.build %>/public/images'
				}]
			}
		},
		copy: {
			build:{
				files: [{
					expand: true,
					cwd: 'app',
					dest: '<%= config.build %>/',
					src: [
						'{.*,*}',
						'src/**',
						'views/**'
					]
				}]
			}
		},
		compress: {
			dist: {
				options: {
					archive: function() {
						var packageJSON = grunt.file.readJSON('package.json');
						return `dist/${packageJSON.name}-${packageJSON.version}.zip`;
					}
				},
				files: [{
					expand: true,
					cwd: '<%= config.build %>',
					src: ['**'],
					dest: ''
				}]
			}
		}
	});

	grunt.registerTask('build', 'create build', [
		'run:clean',
		'useminPrepare',
		'concat:generated',
		'cssmin:generated',
		'uglify:generated',
		'htmlmin',
		'imagemin',
		'copy',
		'usemin',
		'buildPackageJSON'
	]);
	grunt.registerTask('buildPackageJSON', 'build deployment package.json', function(){
		const packageJSON = grunt.file.readJSON('package.json');
		delete packageJSON.devDependencies;
		delete packageJSON.eslintConfig;
		delete packageJSON.main;
		delete packageJSON.repository;
		delete packageJSON.scripts;
		packageJSON.scripts = {
			'start': 'npx nodemon src/index.js'
		};
		grunt.file.write(`${config.build}/package.json`, JSON.stringify(packageJSON, null, '\t'));
	});
	grunt.registerTask('serve', 'start local server', function (){
		grunt.task.run([
			'browserSync:dev',
			'run:start'
		]);
	});
	grunt.registerTask('zip', 'build deployment archive', 'compress');
	grunt.registerTask('default', 'serve');
};

