'use strict';

var prototype = PackageXmlParser.prototype;

var xml2js = require('xml2js'),
    fs     = require('fs'),
    async  = require('async'),
    PipParser = require('./PipParser');

function PackageXmlParser() {

}

prototype.parse = function(runner, done) {
    var that = this;

    this.pips = runner.options.pips;

    async.series([
        function(callback) { that.readXml(callback) },
        function(callback) { that.parseInfo(callback) },
        function(callback) { that.parsePips(callback) }
    ], function () {
        runner.filesToPackage = that.filesToPackage;
        done(null, null);
    });
}

prototype.readXml = function(callback) {
    var that = this;

    fs.readFile('package.xml', function(err, data) {
        var parser = new xml2js.Parser();

        if (err) {
            return callback(new Error("The package.xml could not be read."));
        }

        parser.parseString(data, function (err, result) {
             if (err) {
                 return callback(new Error("The package.xml does not appear to be a valid XML document."));
             }

             that.xml = result;
             callback(null, null);
        });
    });
}

prototype.parseInfo = function(callback) {
    var pack = this.xml.package;
    var info = {
        name: pack['$'].name,
        author: pack.authorinformation[0].author[0],
        version: pack.packageinformation[0].version[0]
    };

    this.info = info;

    callback(null, null);
}

prototype.parsePips = function(callback) {
    var instructions = [];
    this.xml.package.instructions.forEach(function (element) {
        var instruction = element.instruction;
        instruction.forEach(function (element) {
            instructions.push({
                type: element.$.type,
                path: element._
            });
        });
    });

    var parser = new PipParser(this.pips);
    var fileList = parser.run(instructions);

    this.filesToPackage = fileList;

    callback(null, null);
}

module.exports = PackageXmlParser;
