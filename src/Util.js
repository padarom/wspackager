export default class Util
{
    static isTarball(path) {
        return ['.tar', '.tar.gz', '.tgz'].some(end => path.endsWith(end))
    }
}