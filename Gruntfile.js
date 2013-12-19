/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      version: '<%= pkg.version %>',
      banner: 
        '// SpinalTapJS\n' +
        '// ----------------------------------\n' + 
        '// v<%= pkg.version %>\n' +
        '//\n' + 
        '// Copyright (c)<%= grunt.template.today("yyyy") %> Roger Nesbitt.\n' +
        '// Distributed under MIT license\n' +
        '//\n' + 
        '// https://github.com/mogest/spinal-tap\n' +
        '\n'
    },

    concat: {
      options: {
        banner: "<%= meta.banner %>"
      },
      build: {
        src: [
               'src/spinal-tap.js',
               'src/model.js',
               'src/record.js',
               'src/persistence.js'
             ],
        dest: 'dist/spinal-tap.js'
      }
    },

    uglify : {
      options: {
        banner: "<%= meta.banner %>"
      },

      build : {
        src : 'dist/spinal-tap.js',
        dest : 'dist/spinal-tap.min.js',
        options : {
          sourceMap : 'dist/spinal-tap.map',
          sourceMappingURL : 'spinal-tap.map'
        }
      }
    }

  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);
}