'use strict';

var prototype = PackageProcessor.prototype;

function PackageProcessor(environment) {
    this.env = environment
}

prototype.run = function(task) {
    console.log(task);
}

module.exports = PackageProcessor;