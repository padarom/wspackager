const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const tar = require('tar');
const wspackager = require('../lib/index.js');

const EXPECTED_FILE = 'com.example.test_v1.0.0-{test_name}.tar';

describe('usage tests', () => {
    const EXPECTED_CONTENT = [
        'files.tar',
        'templates.tar',
        'package.xml',
        'page.xml'
    ];

    test('it should create a tar.gz file (direct)', (done) => {
        new TestRunner('simple-package', EXPECTED_CONTENT).run(done);
    })
    test('it should create a tar.gz file (cli)', (done) => {
        new TestRunner('simple-package', EXPECTED_CONTENT).runCli(done);
    })
    test('it should create a tar.gz file (directory name with dots)', (done) => {
        new TestRunner('special.package.name', EXPECTED_CONTENT).runCli(done, false, 'com.example.test_v1.0.0.tar.gz');
    })
})

describe('include package tests', () => {
    const EXPECTED_CONTENT = [
        'files.tar',
        'templates.tar',
        'package.xml',
        'page.xml',
        'requirements/',
        'requirements/com.example.test.level2.tar.gz'
    ];

    test('it should include requirements', (done) => {
        new TestRunner('include-package',
            EXPECTED_CONTENT.concat('requirements/com.example.test.level2.tar')
        ).run(done);
    })
    test('it should prepack requirements and include', (done) => {
        new TestRunner('prepack-include-package', EXPECTED_CONTENT).run(done);
    })
})


class TestRunner {

    constructor(testCasePath, expectedContent) {
        this.testCasePath = testCasePath;
        this.expectedContent = expectedContent;
    }

    run(done) {
        const outputFilename = EXPECTED_FILE.replace('{test_name}', 'direct');
        const packageDir = this.#getTestPackagePath(false);
        this.#deletePreviousTestBuild(outputFilename, () => { 
            try {
                wspackager.run({
                    cwd: __dirname,
                    source: packageDir,
                    destination: path.join(packageDir, outputFilename),
                    quiet: true
                })
                .then((result) => {
                    try {
                        this.#expectPackageBuild(result.filename)
                        done()
                    } catch (error) {
                        done(error)
                    }
                })
                .catch((error) => {
                    done(error)
                });
            } catch(error) {
                done(error)
            }
        });
    }

    runCli(done, useDestination = true, outputFilename = false) {
        var isDone = false;
        if (!outputFilename) {
            outputFilename = EXPECTED_FILE.replace('{test_name}', 'cli');
        }

        this.#deletePreviousTestBuild(outputFilename, () => {

            let command = `cd ${this.#getTestPackagePath()} && node ../../lib/bin.js`;
            if (useDestination) {
                command += ` -d ${outputFilename}`;
            }

            const child = exec(command, (err, stdout, stderr) => {
                if (err) {
                    isDone = true;
                    done(err)
                    return;
                }
                if (stderr) {
                    isDone = true;
                    done(stderr)
                    return;
                }
                console.debug(stdout);
            })

            child.on('close', () => {
                try {
                    if (!isDone) {
                        this.#expectPackageBuild(outputFilename)
                        done()
                    }
                } catch (error) {
                    done(error)
                }
            })
        });
    }

    #getTestPackagePath(absolutePath = true) {
        const dir = this.testCasePath;
        if (absolutePath) {
            return path.join(__dirname, dir)
        }
        return dir;
    }
    
    #deletePreviousTestBuild(filename, callback) {
        fs.unlink(path.join(this.#getTestPackagePath(), filename), err => callback());
    }
    
    #expectPackageBuild(filename) {
        const createdPackage = path.join(this.#getTestPackagePath(), filename);
        expect(fs.existsSync(createdPackage)).toBe(true)
    
        let content = [];
    
        tar.t({
            file: createdPackage,
            onentry: entry => {
                content.push(entry.path);
            },
            sync: true
        })
        expect(this.expectedContent.sort()).toEqual(content.sort());
    }
}