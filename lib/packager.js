#!/usr/bin/env node

'use strict';

const program = require('commander');

program
    .version('0.0.1')
    .option('-d, --dry-run', 'only output resulting structure without packaging')
    .option('-g, --gzip', 'use .tar.gz instead of the .tar-format')
    .parse(process.argv);

(function(program) {
    var dryRun = program.dryRun ? program.dryRun : false;
    var gzip  = program.gzip ? program.gzip : false;


    var TaskRunner = require('./TaskRunner');
    var taskRunner = new TaskRunner({ dryRun: dryRun, gzip: gzip });
    taskRunner.run();
})(program);
