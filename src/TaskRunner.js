import fs from 'fs'
import async from 'async'
import Packager from './Packager'
import PackageXmlParser from './PackageXmlParser'

export default class TaskRunner
{
    constructor(options) {
        this.options = options
        this.xml = null
    }

    run() {
        let that = this

        // Run the following instructions in series.
        async.series([
            cb => that.doesPackageXmlExist(cb),
            cb => that.readAndParseFile(cb),
            cb => that.runPackager(cb),
        ], this.done)
    }

    done(err, results) {
        // If any of the functions threw an error, exit here.
        if (err) {
            return console.log(err)
        }
    }

    doesPackageXmlExist(callback) {
        fs.stat('package.xml', function(err, stats) {
            if (err) {
                return callback(new Error("The package.xml could not be accessed in this folder."))
            }

            callback(null, true)
        })
    }

    readAndParseFile(callback) {
        var parser = new PackageXmlParser()
        parser.parse(this, callback)
    }

    runPackager(callback) {
        var packager = new Packager(this.filesToPackage, this.xmlInfo)
        packager.run(callback, this.options.pretend)
    }
}
