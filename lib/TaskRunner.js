'use strict';

var async = require('async'),
    fs    = require('fs');

var prototype = TaskRunner.prototype;

function TaskRunner(options) {
    this.options = options;
    this.xml = null;
}

prototype.run = function()
{
    var that = this;

    // Run the following instructions in series.
    async.series([
        function(callback) { that.doesPackageXmlExist(callback) },
        function(callback) { that.readAndParseFile(callback) },
        function(callback) { that.readPips(callback) },
    ], this.done);
}

prototype.done = function(err, results)
{
    // If any of the functions threw an error, exit here.
    if (err) {
        return console.log(err);
    }
}

prototype.doesPackageXmlExist = function(callback)
{
    fs.stat('package.xml', function(err, stats) {
        if (err) {
            return callback(new Error("The package.xml could not be accessed in this folder."));
        }

        callback(null, true);
    });
}

prototype.readAndParseFile = function(callback)
{
    this.xml = "[Parsed XML]";
    callback(null, null);
}

prototype.readPips = function(callback)
{
    var xml = this.xml;
    console.log(xml);
}

module.exports = TaskRunner;
