import { buildTree, outputTree } from './TreeBuilder'
import PackageXmlParser from './PackageXmlParser'
import TaskRunner from './TaskRunner'
import Util from './Util'
import chalk from 'chalk'
import async from 'async'
import glob from 'glob'
import path from 'path'
import _ from 'lodash'
import tar from 'tar'
import fs from 'fs'

export default class Packager
{
    constructor(files, packageInfo) {
        this.packageInfo = packageInfo

        // Order by intermediate files
        files.sort((a, b) => {
            if (a.intermediate > b.intermediate) return -1;
            else return 1;
        })

        // Remove duplicates from array
        this.filesToPackage = _.uniqBy(files, 'path')
    }

    run(done, destination, quiet) {
        this.destination = destination

        async.series({
            localFiles:     cb => this.findLocalFiles(cb),
            treeStructure:  cb => this.writeTreeStructure(quiet, cb),
            prepackage:     cb => this.prepackage(cb),
            package:        cb => this.packageAll(cb),
            fileStats:      cb => this.getFileStats(cb),
        }, (err, results) => {
            // always run cleanup
            this.cleanup(() => {
                if (err) {
                    done(err)
                    return
                }
                results = {
                    filename: results.package === undefined ? results.package : path.basename(results.package),
                    path: results.package,
                    filesize: results.fileStats
                }
    
                if (!quiet) {
                    console.log('-> ' + chalk.green.bold('Package generated')
                        + ' (' + results.filesize + ')')
                }
    
                done(err, results)
            })
        })
    }

    getFileProcessingList() {
        return this.filesToPackage.map(item => {
            return (callback) => {
                const path = item.path;
                const adjustedPath = path.replace(/\.tar(\.gz)?$/i, '');
                const newItem = {
                    original: path,
                    isPackage: item.isPackage,
                    identifier: item.identifier,
                    originalExists: false
                }
    
                if (glob.hasMagic(adjustedPath)) {
                    glob(adjustedPath, (err, files) => {
                        newItem.paths = files
                        callback(err, newItem)
                    })
                } else {
                    fs.stat(path, function(err, stats) {
                        if (err) {
                            newItem.paths = [adjustedPath]
                        } else {
                            if (item.isPackage) {
                                // add package as tarball and not directory
                                newItem.paths = [path]
                            } else {
                                newItem.paths = [adjustedPath]
                            }
                            newItem.originalExists = true
                        }
                        callback(null, newItem)
                    })
                }
            }
        })
    }

    getFileStats(done) {
        fs.stat(this.getDestinationPath(), (err, stats) => {
            function bytesToSize(bytes) {
               var sizes = ['Bytes', 'KB', 'MB', 'GB']
               if (bytes == 0) return '0 Byte'
               var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
               return Math.round(bytes / Math.pow(1000, i), 2) + ' ' + sizes[i]
            };

            done(err, bytesToSize(stats.size))
        })
    }

    findLocalFiles(done) {
        let that = this
        let fileProcessingList = this.getFileProcessingList()

        async.parallel(fileProcessingList, (err, results) => {
            var prepack = []
            var direct = ['package.xml']
            results.forEach(instruction => {
                if (
                    (instruction.isPackage && !instruction.originalExists) ||
                    (!instruction.isPackage && Util.isTarball(instruction.original))
                ) {
                    prepack = prepack.concat(instruction)
                } else {
                    direct = direct.concat(
                        instruction.paths.map(i => i.replace(/\.tar@$/, '.tar'))
                    )
                }
            })

            that.packagingPlan = {
                prepack, direct
            }

            done()
        })
    }

    prepackage(done) {
        let that = this

        const tasks = this.packagingPlan.prepack.map(instruction => {
            return (callback) => {
                if (instruction.isPackage) {
                    // handle additional packages
                    that.prepackAdditionalPackages(instruction, callback)
                } else {
                    var dir = instruction.paths[0]
                    tar.c(
                        {
                            file: dir + '.tar',
                            cwd: dir,
                            portable: true,
                            filter: (filePath, stat) => {
                                let file = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/')
                                return dir == file || !that.isIntermediateFile(file)
                            }
                        },
                        fs.readdirSync(dir),
                        (err) => {
                            callback(err)
                        }
                    )
                }
            }
        });

        async.waterfall(tasks, err => done(err))
    }

    prepackAdditionalPackages(instruction, callback) {
        var dir = instruction.paths[0]
        var options = {
            destination: instruction.original,
            quiet: true
        }

        const runPackager = () => {
            new TaskRunner(options).run()
            .then(result => callback())
            .catch(callback)
        }

        fs.stat(dir, (err, stats) => {
            if (!err) {
                options.source = dir
                runPackager()
            }
            // try to find package directory
            else {
                dir = path.dirname(dir)
                this.findAdditionalPackage(dir, instruction.identifier, (err, result) => {
                    if (err) {
                        callback(err)
                        return
                    }
                    if (!result) {
                        callback(`Unable to locate package '${instruction.identifier}', which is defined to be included`)
                        return
                    }
                    options.source = result
                    runPackager()
                })
            }
        })
    }

    /**
     * Tries to find a package by reading all package.xml files
     * in the directory and comparing the identifier name
     * 
     * @param {string} directory directory to recursively look in
     * @param {string} identifier package identifier name to look for
     * @param {function} done callback 
     */
    findAdditionalPackage(directory, identifier, done) {
        glob(path.join(directory, '/**/package.xml'), (err, files) => {
            if (err) {
                done(err)
                return
            }
            if (files.length <= 0) {
                done()
                return
            }
            const parser = new PackageXmlParser()
            let tasks = files.map(file => {
                return (callback) => {
                    async.series([
                        cb => parser.readXml(file, cb),
                        cb => parser.parseInfo(cb)
                    ], (err) => {
                        if (err) {
                            callback(err)
                            return
                        }
                        var dirFound = null
                        if (parser.info.name === identifier) {
                            dirFound = path.dirname(file)
                        }
                        callback(null, dirFound)
                    })
                }
            })

            // run all tasks and only return an error if all failed
            async.race(async.reflectAll(tasks), (err, result) => {
                var error = err;
                if (!result.error) {
                    if (result.value) {
                        done(null, result.value)
                        return
                    }
                } else {
                    error = result.error
                }
                done(error)
            })
        })
    }

    isIntermediateFile(name, omitTar) {
        for (var file in this.filesToPackage) {
            let filename = this.filesToPackage[file].path
            if (filename == name + '.tar' || (omitTar && filename == name)) {
                return this.filesToPackage[file].intermediate
            }
        }

        return false
    }

    packageAll(done) {
        let that = this
        
        let streams = []

        let files = this.packagingPlan.direct.concat(
            this.packagingPlan.prepack.map(item => item.original)
        ).map(path.normalize) // Windows compatibility

        var folders = []
        files.forEach(dir => {
            // Don't include folders that only contain intermediate files
            if (that.isIntermediateFile(dir, true)) return

            var base = path.dirname(dir)
            let dirs = [base]
            while (path.dirname(base) != '.') {
                base = path.dirname(base)
                dirs.push(base)
            }
            folders = folders.concat(dirs)
        })

        folders = folders.filter(
            (el, i, arr) => arr.indexOf(el) === i
        )

        // Make sure directory exists
        let destination = that.getDestinationPath()
        const dir = path.dirname(destination);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        tar.c(
            { 
                file: destination,
                portable: true,
                preservePaths: false,
                gzip: (destination.substr(-6) === 'tar.gz'),
                filter: (filePath, stat) => {
                    // Remove path up to cwd
                    let file = path.relative(process.cwd(), filePath)
                    return !that.isIntermediateFile(file, true) &&
                        (!file // Zero-length-string = cwd
                        || folders.indexOf(file) !== -1
                        || files.indexOf(file) !== -1)
                }
            },
            fs.readdirSync(process.cwd()),
            (err) => {
                done(err, destination)
            }
        )
    }

    getDestinationPath() {
        var destination = this.destination

        if (path.extname(destination) === '')
          destination = path.join(destination, '{name}_v{version}.tar.gz');

        destination = path.normalize(destination.replace('{name}', this.packageInfo.name).replace('{version}', this.packageInfo.version.replace(/\s+/gi,'_')))

        return destination
    }

    cleanup(done) {
        if (
            !this.packagingPlan ||
            !this.packagingPlan.prepack ||
            this.packagingPlan.prepack.length <= 0
        ) {
            done()
            return
        }
        const deleteTasks = this.packagingPlan.prepack.map(it => {
            // make sure it only deletes tarball's
            if (!Util.isTarball(it.original)) {
                return
            }
            return (callback) => fs.unlink(it.original, () => callback())
        });

        async.parallel(deleteTasks, () => done());
    }

    writeTreeStructure(quiet, done) {
        if (quiet)
            return done()

        let that = this
        var tree = {}
        this.packagingPlan.direct.forEach(file => {
            tree = buildTree(tree, file)
        })

        let nonIntermediatePrepacks = this.packagingPlan.prepack
            .filter(it => !that.isIntermediateFile(it.paths[0]))
        
        nonIntermediatePrepacks.forEach(it => {
            tree = buildTree(tree, it.original)
        })

        console.log(chalk.bold.green(path.basename(this.getDestinationPath())))
        outputTree(tree)

        done()
    }
}
