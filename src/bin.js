#!/usr/bin/env node

import TaskRunner from './TaskRunner'
import program from 'commander'

let collectPips = function (value, list) {
    var splitted = value.split('=')
    list[splitted[0]] = splitted[1]
    return list
}

program
    .version('0.0.1')
    .option('-p, --pretend', 'only output resulting structure without packaging')
    .option('-g, --gzip', 'use .tar.gz instead of the .tar-format')
    .option('--pip [value]', 'if default files for custom PIPs are used, use this parameter to specify the default', collectPips, {})
    .option('-q, --quiet', 'omit any output')
    .parse(process.argv);

(function(program) {
    // Run the program.
    new TaskRunner({
        gzip: program.gzip,
        pips: program.pip,
        quiet: program.quiet,
        cwd: process.cwd()
    }).run()
})(program)
