'use strict';

var prototype = TaskListProcessor.prototype;

/**
 * A controller that handles all possible tasks and defers
 * them to specific processor instances.
 * 
 * @param {Object} environment The environment to use.
 * @constructor
 */
function TaskListProcessor(environment) {
    this.env = environment;
    this.supportedTasks = {
        package: './PackageProcessor'
    };
}

/**
 * Make an array from a list of, or a single object.
 * 
 * @param {Array.<Object>|Object} options The array or object that should
 *     become an array.
 * @return {Array.<Object>} A list of objects
 */
prototype.makeTaskArray = function(options) {
    if (options instanceof Array) {
        return options;
    }

    return [options];
};

/**
 * Process a task with a given options list.
 * 
 * @param {string} task The task to run.
 * @param {Array.<Object>} list The list of options to run the task with.
 */
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