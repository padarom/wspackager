const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const tar = require('tar');
const wspackager = require('../lib/index.js');

const EXPECTED_FILE = 'com.example.test_v1.0.0-{test_name}.tar';

export default class TestRunner {
    constructor (testCasePath, expectedContent) {
        this.testCasePath = testCasePath;
        this.expectedContent = expectedContent;
    }
    
    run (done) {
        const outputFilename = EXPECTED_FILE.replace('{test_name}', 'direct');
        const packageDir = this.getTestPackagePath(false);
        
        this.deletePreviousTestBuild(outputFilename, async () => { 
            try {
                const result = await wspackager.run({
                    cwd: __dirname,
                    source: packageDir,
                    destination: path.join(packageDir, outputFilename),
                    quiet: true
                });
                
                this.expectPackageBuild(result.filename);
                done();
            } catch(error) {
                done(error);
            }
        });
    }
    
    runCli (done, useDestination = true, outputFilename = false) {
        var isDone = false;
        if (!outputFilename) {
            outputFilename = EXPECTED_FILE.replace('{test_name}', 'cli');
        }
        
        this.deletePreviousTestBuild(outputFilename, () => {
            let command = `cd ${this.getTestPackagePath()} && node ../../lib/bin.js`;
            if (useDestination) {
                command += ` -d ${outputFilename}`;
            }
            
            const child = exec(command, (err, stdout, stderr) => {
                if (err) {
                    isDone = true;
                    done(err);
                    return;
                }
                if (stderr) {
                    isDone = true;
                    done(stderr);
                    return;
                }
                console.debug(stdout);
            })
            
            child.on('close', () => {
                try {
                    if (!isDone) {
                        this.expectPackageBuild(outputFilename);
                        done();
                    }
                } catch (error) {
                    done(error);
                }
            });
        });
    }
    
    getTestPackagePath (absolutePath = true) {
        const dir = this.testCasePath;
        if (absolutePath) {
            return path.join(__dirname, dir);
        }
        
        return dir;
    }
    
    deletePreviousTestBuild (filename, callback) {
        fs.unlink(path.join(this.getTestPackagePath(), filename), err => callback());
    }
    
    expectPackageBuild (filename) {
        const createdPackage = path.join(this.getTestPackagePath(), filename);
        expect(fs.existsSync(createdPackage)).toBe(true);
        
        let content = [];
        
        tar.t({
            file: createdPackage,
            onentry: entry => {
                content.push(entry.path);
            },
            sync: true
        });
        
        expect(this.expectedContent.sort()).toEqual(content.sort());
    }
}
