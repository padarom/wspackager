import path from 'path'
import _ from 'lodash'
import TaskRunner from './TaskRunner'

exports.run = async (options) => {
    options = _.defaults(options, {
        source: '.'
    })
    options.source = path.resolve(require.main.path, options.source)
    return new TaskRunner(options).run();
}
