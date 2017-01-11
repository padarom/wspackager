import fs from 'fs'
import tar from 'tar'
import del from 'del'

export default class Packager
{
    run(files, callback, pretend) {
        console.log(files)

        callback(null, null)
    }
}
