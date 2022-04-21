import fs from 'fs'


/**
 * A list of all PIPs shipped with WSC and their default file names.
 *
 * @see {@link https://github.com/WoltLab/WCF/tree/master/wcfsetup/install/files/lib/system/package/plugin}
 */
var DEFAULT_PIP_FILENAMES = {
    acpTemplate: 'acptemplates.tar',
    file: 'files.tar',
    language: 'language/*.xml',
    script: null,
    sql: 'install.sql',
    style: null,
    template: 'templates.tar'
};

export default class PipParser
{
    constructor(additionalPips) {
        this.additionalPips = additionalPips
    }

    run(instructions) {
        var pips = this.getPipList()

        return {
            files: instructions.map(it => this.getFileName(it, pips)),
            styles: this.getStylePaths(instructions)
        }
    }

    getStylePaths(pips) {
        var result = []

        for (var pip of pips) {
            if (pip.type == 'style') {
                result.push(pip.path.replace('.tar', ''))
            }
        }

        return result
    }

    getPipList() {
        let that = this

        var pipList = DEFAULT_PIP_FILENAMES
        for (var pip in this.additionalPips) {
            pipList[pip] = that.additionalPips[pip]
        }

        return pipList
    }

    getFileName(instruction, pips) {
        if (instruction.path) {
            return instruction.path
        }

        if (pips[instruction.type]) {
            return pips[instruction.type]
        }

        // default value for all xml based pips
        if (fs.existsSync(instruction.type + '.xml')) {
            return instruction.type + '.xml';
        }

        throw new Error('No file was found with the default filename and no filename was provided for the PIP "' + instruction.type + '"')
    }
}
