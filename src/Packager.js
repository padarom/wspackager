var fs = require('fs'),
    tar = require('tar'),
    del = require('del');

export default class Packager
{
    run(files, callback, pretend) {
        console.log(files)

        callback(null, null)
    }
}
