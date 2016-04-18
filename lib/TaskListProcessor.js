'use strict';

var prototype = TaskListProcessor.prototype;

function TaskListProcessor(environment) {
    this.env = environment;
    this.supportedTasks = {
        package: './PackageProcessor'
    };
}

prototype.makeTaskArray = function(options) {
    if (options instanceof Array) {
        return options;
    }

    return [options];
};

prototype.process = function(task, list) {
    if (!this.supportedTasks[task]) {
        // Throw exception
    }
    
    var processorClass = require(this.supportedTasks[task]);
    var Processor = new processorClass(this.env);
    list.forEach(function (element) {
        Processor.run(element);
    });
};

module.exports = TaskListProcessor;