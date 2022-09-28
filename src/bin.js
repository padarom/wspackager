#!/usr/bin/env node

import TaskRunner from './TaskRunner'
import program from 'commander'
import pkg from '../package.json'

let collectPips = function (value, list) {
    var splitted = value.split('=')
    list[splitted[0]] = splitted[1]
    return list
}

program
    .version(pkg.version)
    .option('--pip [value]', 'if default files for custom PIPs are used, use this parameter to specify the default', collectPips, {})
    .option('-s, --source [value]', 'The path where the package files should be read from (defaults to cwd)', '.')
    .option('-d, --destination [value]', 'The path the resulting archive will be saved to (defaults to cwd)', '.')
    .option('-q, --quiet', 'omit any output')
    .parse(process.argv);

(function(program) {
    const options = program.opts();
    // Run the program.
    new TaskRunner({
        pips: options.pip,
        source: options.source,
        destination: options.destination,
        quiet: options.quiet,
    })
    .run().catch((err) => {
        console.error(err);
    });
})(program)
