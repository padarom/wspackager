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
            cb => this.readXml('package.xml', cb),
            cb => this.parseInfo(cb),
            cb => this.parsePips(cb),
            cb => this.parseAdditionalPackages(cb),
        ], function(err) {
            if (!err) {
                runner.filesToPackage = that.filesToPackage
                runner.xmlInfo = that.info
            }
            done(err)
        })
    }

    readXml(file, callback) {
        let that = this

        fs.readFile(file, function(err, data) {
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

        let list
        try {
            let parser = new PipParser(this.pips)
            list = parser.run(instructions)
        } catch (err) {
            callback(err);
            return;
        }

        this.filesToPackage = list.files.map(it => { return {path: it, intermediate: false} })

        if (list && list.styles && list.styles[0]) {
            this.parseStyleXML(list.styles[0], callback)
        } else {
            callback()
        }
    }

    parseStyleXML(path, callback) {
        let that = this

        fs.readFile(path + '/style.xml', function(err, data) {
            var parser = new xml2js.Parser()

            if (err) {
                return callback(new Error("The style.xml could not be read."))
            }

            parser.parseString(data, function (err, result) {
                 if (err) {
                     return callback(new Error("The style.xml does not appear to be a valid XML document."))
                 }

                 var additionalPackages = [];
                 if (result.style.files) {
                     // Only one files section should be parsed
                     for (var file in result.style.files[0]) {
                         if (file == 'templates' || file == 'images') {
                             let tag = result.style.files[0][file][0]
                             let filename = typeof tag === 'object' ? tag._ : tag
                             additionalPackages.push({path: path + '/' + filename, intermediate: true})
                         }
                     }
                 }

                 that.filesToPackage = that.filesToPackage.concat(additionalPackages)
                 callback()
            })
        })
    }

    parseAdditionalPackages(callback) {
        var packages = []

        var optionals = this.xml.package.optionalpackages
        var requireds = this.xml.package.requiredpackages

        let addPackagePaths = paths => {
            for (let path of paths) {
                var query = []
                if (path.requiredpackage) query = path.requiredpackage
                if (path.optionalpackage) query = path.optionalpackage

                for (let pack of query) {
                    if (pack.$.file) {
                        packages.push({
                            path: pack.$.file,
                            intermediate: false,
                            isPackage: true,
                            identifier: pack._
                        })
                    }
                }
            }
        }

        if (optionals) addPackagePaths(optionals)
        if (requireds) addPackagePaths(requireds)

        this.filesToPackage = this.filesToPackage.concat(packages)

        callback()
    }
}
