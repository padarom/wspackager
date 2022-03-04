#!/usr/bin/env node

import TaskRunner from './TaskRunner'
import program from 'commander'

let collectPips = function (value, list) {
    var splitted = value.split('=')
    list[splitted[0]] = splitted[1]
    return list
}

program
    .version('1.3.1')
    .option('-p, --pretend', 'only output resulting structure without packaging')
    .option('--pip [value]', 'if default files for custom PIPs are used, use this parameter to specify the default', collectPips, {})
    .option('-s, --source [value]', 'The path where the package files should be read from (defaults to cwd)', '.')
    .option('-d, --destination [value]', 'The path the resulting archive will be saved to (defaults to cwd)', '.')
    .option('-q, --quiet', 'omit any output')
    .parse(process.argv);

(function(program) {
    // Run the program.
    new TaskRunner({
        gzip: program.gzip,
        pips: program.pip,
        quiet: program.quiet,
        cwd: process.cwd(),
        source: program.source,
        destination: program.destination,
    })
    .run().catch((err) => {
        console.error(err);
    });
})(program)
