#!/usr/bin/env node

'use strict';

const program = require('commander');
const processor = require('../lib/index');

program
    .version('0.0.1')
    .option('-d, --dry-run', 'only output resulting structure without packaging')
    .option('--tar-gz', 'use .tar.gz instead of the .tar-format')
    .parse(process.argv);

processor(program);
