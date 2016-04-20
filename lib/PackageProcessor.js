'use strict';

var fstream = require('fstream');
var async   = require('async');
var path = require('path');
var tar  = require('tar');
var del  = require('del');
var fs   = require('fs');

var prototype = PackageProcessor.prototype;

/**
 * A Processor that handles the "package" task to build a
 * tarball using a given configuration.
 * @param {Object} environment The environment that is used with the task
 * @constructor
 */
function PackageProcessor(environment) {
    this.cwd = environment.cwd
}

/**
 * Builds an absolute path from a given path component.
 * 
 * @param {string} component The path component to use.
 * @return {string} The resulting absolute path.
 */
prototype.path = function(component) {
    if (!component) {
        return this.cwd;
    }
    
    if (path.isAbsolute(component)) {
        return component;
    }        
    
    return this.cwd + "/" + component;
}

/**
 * Runs the task with the given configuration.
 * 
 * @param {Object} task The configuration to use.
 */
prototype.run = function(task) {
    var that = this;
    var tarballed = [];
    
    if (task.base) {
        this.cwd = this.path(task.base);
    }
    
    // Create array to track files that should be deleted when done
    that.deleteAfterwards = [];
    
    var files = task.files;
    
    // Step 1: Run tarball subtask
    if (typeof files.tarball !== undefined) {
        files.tarball.forEach(function (ball) {
            // Allow different source and destination file names
            var sourceBall = ball;
            var destBall   = ball + '.tar';
            
            if (typeof ball === 'object') {
                sourceBall = Object.keys(ball)[0];
                destBall   = ball[sourceBall] + '.tar'; 
            }
            
            var source      = that.path(sourceBall);
            var destination = that.path(destBall);
            
            that.deleteAfterwards.push(destination);
            
            tarballed.push(function(callback) {
                that.createTarball(source, destination, null, function() {                   
                    callback(null, sourceBall);
                });
            });
           
        });
    }
    
    // Step 2: Tarball the rest
    async.parallel(tarballed, function (err, result) {
        
        var source      = that.path();
        var destination = that.path(task.destination);
        
        var excluded = files.exclude || [];
        excluded = excluded.concat(result);
        excluded.push(task.destination);
        
        that.createTarball(source, destination, excluded, function() {
            that.cleanup();
        });
    });
}

/**
 * Deletes files that have been designated 
 * to be removed after building.
 */
prototype.cleanup = function() {
    this.deleteAfterwards.forEach(function (path) {
        del(path); 
    });
}

/**
 * Creates a tarball from the base of the given source.
 * 
 * @param {string} source The absolute path to the source.
 * @param {string} destination The absolute path to the destination 
 *     (including extension).
 * @param {Array.<string>|null} exclude An (optional) array of paths 
 *     that should not show up in the tarball.
 * @param {Function} callback The callback to be called,
 *     once the packaging process has completed.
 */
prototype.createTarball = function(source, destination, exclude, callback) {
    var that = this;
    exclude = exclude || [];
    
    var stream = fstream.Reader({
        path: source,
        filter: function (entry) {
            return exclude.indexOf(entry.basename) == -1;
        }
    });
    
    stream.pipe(tar.Pack({ 
        noProprietary: true, fromBase: true 
    })).pipe(fstream.Writer({
        path: destination
    }));
        
    stream.on('end', function() {
        callback();
    });
}

module.exports = PackageProcessor;