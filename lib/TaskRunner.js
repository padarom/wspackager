'use strict';

var prototype = TaskRunner.prototype;

function TaskRunner(options) {
    this.options = options;
}

prototype.run = function()
{
    console.log(this.options);
}

module.exports = TaskRunner;
