import fs from 'fs'
import async from 'async'
import xml2js from 'xml2js'
import PipParser from './PipParser'

export default class PackageXmlParser
{
    parse(runner, done) {
        let that = this
        this.pips = runner.options.pips

        async.series([
            cb => this.readXml(cb),
            cb => this.parseInfo(cb),
            cb => this.parsePips(cb)
        ], function() {
            runner.filesToPackage = that.filesToPackage
            runner.xmlInfo = that.info
            done()
        })
    }

    readXml(callback) {
        let that = this

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
                 callback()
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

        callback()

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

        callback()
    }
}
