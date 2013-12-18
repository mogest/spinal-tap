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
        '\n',

    }

    

  });
}