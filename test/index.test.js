const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const tar = require('tar');
const wspackager = require('../lib/index.js');

const EXPECTED_FILE = 'com.example.test_v1.0.0-{test_name}.tar.gz';
const EXPECTED_CONTENT = [
    'files.tar',
    'templates.tar',
    'package.xml',
    'page.xml',
]

describe('build package (direct)', () => {
    test('it should create a tar.gz file', (done) => {
        const outputFilename = EXPECTED_FILE.replace('{test_name}', 'direct');
        deletePreviousTestBuild(outputFilename, () => { 
            try {
                wspackager.run({
                    source: getTestPackagePath(false),
                    destination: outputFilename
                })
                .then((result) => {
                    try {
                        expectPackageBuild(result.filename)
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
    })
})

describe('build package (cli)', () => {
    test('it should create a tar.gz file', (done) => {
        const outputFilename = EXPECTED_FILE.replace('{test_name}', 'cli');
        deletePreviousTestBuild(outputFilename, () => {
            const command = `cd ${getTestPackagePath()} && node ../../lib/bin.js -d ${outputFilename}`;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    done(err)
                    return;
                }
                if (stderr) {
                    done(stderr)
                    return;
                }
                console.debug(stdout);
                try {
                    expectPackageBuild(outputFilename)
                    done()
                } catch (error) {
                    done(error)
                }
            })
        });
    })
})


function getTestPackagePath(absolutePath = true) {
    const dir = './simple-package';
    if (absolutePath) {
        return path.join(__dirname, dir)
    }
    return dir;
}

function deletePreviousTestBuild(filename, callback) {
    fs.unlink(path.join(getTestPackagePath(), filename), err => callback());
}

function expectPackageBuild(filename) {
    const createdPackage = path.join(getTestPackagePath(), filename);
    expect(fs.existsSync(createdPackage)).toBe(true)

    let content = [];

    tar.t({
        file: filename,
        onentry: entry => {
            content.push(entry.path);
        },
        sync: true
    })
    expect(EXPECTED_CONTENT.sort()).toEqual(content.sort());
}