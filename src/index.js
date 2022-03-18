import TaskRunner from './TaskRunner'

exports.run = async (options) => {
    return new TaskRunner(options).run();
}
