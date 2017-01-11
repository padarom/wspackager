import fs from 'fs'
import async from 'async'
import xml2js from 'xml2js'
import PipParser from './PipParser'

export default class PackageXmlParser
{
    parse(runner, done) {
        var that = this

        this.pips = runner.options.pips

        async.series([
            callback => that.readXml(callback),
            callback => that.parseInfo(callback),
            callback => that.parsePips(callback)
        ], function() {
            runner.filesToPackage = that.filesToPackage
            done(null, null)
        })
    }

    readXml(callback) {
        var that = this

        fs.readFile('package.xml', function(err, data) {
            var parser = new xml2js.Parser()

            if (err) {
                return callback(new Error("The package.xml could not be read."))
            }

            parser.parseString(data, function (err, result) {
                 if (err) {
                     return callback(new Error("The package.xml does not appear to be a valid XML document."))
                 }

                 that.xml = result
                 callback(null, null)
            })
        })
    }

    parseInfo(callback) {
        var pack = this.xml.package
        var info = {
            name: pack['$'].name,
            author: pack.authorinformation[0].author[0],
            version: pack.packageinformation[0].version[0]
        }

        this.info = info

        callback(null, null)

    }

    parsePips(callback) {
        var instructions = []
        this.xml.package.instructions.forEach(function (element) {
            var instruction = element.instruction
            instruction.forEach(function (element) {
                instructions.push({
                    type: element.$.type,
                    path: element._
                })
            })
        })

        var parser = new PipParser(this.pips)
        var fileList = parser.run(instructions)

        this.filesToPackage = fileList

        callback(null, null)
    }
}
