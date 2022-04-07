import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import process from 'process'
import async from 'async'
import Packager from './Packager'
import PackageXmlParser from './PackageXmlParser'

export default class TaskRunner
{
    constructor(options) {
        this.options = _.defaults(options, {
            pips: {},
            quiet: false,
            source: '.',
            destination: '.',
            cwd: process.cwd()
        })

        // resolve paths into absolute paths
        this.options.source = path.resolve(this.options.cwd, this.options.source)
        this.options.destination = path.resolve(this.options.cwd, this.options.destination)

        this.xml = null
    }

    run() {
        let that = this

        // TODO don't use chdir to prevent potential issues with cwd unexpectedly changing
        this.oldCwd = process.cwd()
        process.chdir(this.options.source)
        
        return new Promise((resolve, reject) => {
            // Run the following instructions in series.
            async.series(
                [
                    cb => that.doesPackageXmlExist(cb),
                    cb => that.readAndParseFile(cb),
                    cb => that.runPackager(cb),
                ], 
                (err, results) => {
                    // restore current working directory
                    process.chdir(this.oldCwd)
                    // If any of the functions threw an error, exit here.
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results.pop());
                    }
                }
            )
        });
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
        packager.run(callback, this.options.destination, this.options.quiet)
    }
}
