'use strict';

var TaskListProcessor = require('./TaskListProcessor');

module.exports = {

    processTaskList: function(options, environment) {
        var Processor = new TaskListProcessor(environment);
        Object.keys(Processor.supportedTasks).forEach(function(task) {
            if (!options[task]) {
                return;
            }

            var optionList = Processor.makeTaskArray(options[task]);
            Processor.process(task, optionList);
        });
    }

};