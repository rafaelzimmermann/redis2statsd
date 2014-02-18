module.exports = function(grunt) {


  // Project configuration.
    grunt.initConfig({
        // Configure a mochaTest task
        mochaTest: {
            test: {
              options: {
                reporter: 'spec'
              },
              src: ['test/**/*.js']
            }
        },
        jshint: {
            files: ["grunt.js", "lib/**/*.js", "test/**/*.js"],

            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: false,
                newcap: false,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                strict: false,
                node: true,
                trailing: true,
                globals: {
                    exports: true,
                    describe: false,
                    it: false
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks('grunt-mocha-test');

    // Default task(s).
    grunt.registerTask('default', ['jshint','mochaTest']);

};
