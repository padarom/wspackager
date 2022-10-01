import TestRunner from './TestRunner'

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

    test('it should create tar.gz files for packages with void instructions', (done) => {
        new TestRunner('void-instructions', ['files.tar', 'package.xml']).runCli(done);
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
