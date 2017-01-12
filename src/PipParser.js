/**
 * A list of all PIPs shipped with WSC and their default file names.
 *
 * @see {@link https://github.com/WoltLab/WCF/tree/master/wcfsetup/install/files/lib/system/package/plugin}
 */
const DEFAULT_PIP_FILENAMES = {
    aclOption: 'aclOption.xml',
    acpMenu: 'acpMenu.xml',
    acpSearchProvider: 'acpSearchProvider.xml',
    acpTemplate: 'acptemplates.tar',
    bbcode: 'bbcode.xml',
    box: null,
    clipboard: null,
    coreObject: null,
    cronjob: null,
    eventListener: null,
    file: 'files.tar',
    language: 'language/*.xml',
    menu: null,
    menuitem: null,
    objectType: null,
    objectTypeDefinition: null,
    option: null,
    page: null,
    pip: 'packageInstallationPlugin.xml',
    script: null,
    smiley: null,
    sql: 'install.sql',
    style: null,
    template: 'templates.tar',
    templateListener: null,
    userGroupOption: null,
    userOption: null,
    userProfileMenu: null,
    userNotificationEvent: null,
}

export default class PipParser
{
    constructor(additionalPips) {
        this.additionalPips = additionalPips
    }

    run(instructions) {
        var pips = this.getPipList()

        return instructions.map(it => this.getFileName(it, pips))
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

        throw new Error('No default filename was provided for the PIP "' + instruction.type + '"')
    }
}
