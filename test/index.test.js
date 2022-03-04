const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const wspackager = require('../lib/index.js');

describe('build package', () => {
    test('it should create a tar.gz file', (done) => {
        deletePreviousTestBuild();

        try {
            wspackager.run({source: getTestPackagePath(false)})
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
    })
})

describe('build package (cli)', () => {
    test('it should create a tar.gz file', (done) => {
        deletePreviousTestBuild();

        const command = `cd ${getTestPackagePath()} && node ../../lib/bin.js`;
        exec(command, (err, stdout, stderr) => {
            if (err) {
                done(err)
                return;
            }
            if (stderr) {
                done(stderr)
                return;
            }
            try {
                expectPackageBuild()
                done()
            } catch (error) {
                done(error)
            }
        })
    })
})


function getTestPackagePath(absolutePath = true) {
    const dir = './simple-package';
    if (absolutePath) {
        return path.join(__dirname, dir)
    }
    return dir;
}

function deletePreviousTestBuild() {
    try {
        fs.unlinkSync(path.join(getTestPackagePath, 'com.example.test_v1.0.0.tar.gz'));
    } catch {
        // ignore
    } 
}

function expectPackageBuild(filename = 'com.example.test_v1.0.0.tar.gz') {
    const createdPackage = path.join(getTestPackagePath(), filename);
    expect(fs.existsSync(createdPackage)).toBe(true)
}