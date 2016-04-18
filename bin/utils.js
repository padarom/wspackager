#!/usr/bin/env node

'use strict';
var path = require('path');
var shifter = require(path.join('../lib'));
var chalk = require('chalk');
var Liftoff = require('liftoff');
var argv = require('minimist')(process.argv.slice(2));
require('require-yaml');

process.env.INIT_CWD = process.cwd();

var WCFUtils = new Liftoff({
    name: 'wcfutils',
    processTitle: 'wcfutils',
    modulePath: 'wcfutils',
    configName: '.wcfutil',
    extensions: {
        '.yaml': 'require-yaml',
        '.yml':  'require-yaml'
    }
});

WCFUtils.launch({
    cwd: argv.cwd,
    configPath: argv.utilsfile,
    completion: argv.completion
}, invoke);

function invoke(env) {
    if (!env.configPath) {
        console.log(chalk.red('No wcfutils config found'));
    }
    
    // Load the task list
    var tasks = require(env.configPath);
    shifter.processTaskList(tasks, env);

    // Base Path: env.configBase
}