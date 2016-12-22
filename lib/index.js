'use strict';

var TaskRunner = require('./TaskRunner');

module.exports = function(program) {
    var dryRun = program.dryRun ? program.dryRun : false;
    var tarGz  = program.tarGz ? program.tarGz : false;

    var taskRunner = new TaskRunner({ dryRun: dryRun, tarGz: tarGz });
    taskRunner.run();
}
