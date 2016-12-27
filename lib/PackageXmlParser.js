'use strict';

var prototype = PackageXmlParser.prototype;

var xml2js = require('xml2js'),
    fs     = require('fs'),
    async  = require('async');

function PackageXmlParser() {

}

prototype.parse = function(done) {
    var that = this;

    async.series([
        function(callback) { that.readXml(callback) },
        function(callback) { that.parseInfo(callback) },
        function(callback) { that.parsePips(callback) },
    ]);
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
    console.log(this.info);
}

module.exports = PackageXmlParser;
