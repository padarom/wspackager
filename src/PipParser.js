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
    box: 'box.xml',
    clipboard: 'clipboard.xml',
    coreObject: 'coreObject.xml',
    cronjob: 'cronjob.xml',
    eventListener: 'eventListener.xml',
    file: 'files.tar',
    language: 'language/*.xml',
    menu: 'menu.xml',
    menuitem: 'menuitem.xml',
    objectType: 'objectType.xml',
    objectTypeDefinition: 'objectTypeDefinition.xml',
    option: 'option.xml',
    page: 'page.xml',
    pip: 'packageInstallationPlugin.xml',
    script: null,
    smiley: 'smiley.xml',
    sql: 'install.sql',
    style: null,
    template: 'templates.tar',
    templateListener: 'templateListener.xml',
    userGroupOption: 'userGroupOption.xml',
    userOption: 'userOption.xml',
    userProfileMenu: 'userProfileMenu.xml',
    userNotificationEvent: 'userNotificationEvent.xml'
}

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

        throw new Error('No default filename was provided for the PIP "' + instruction.type + '"')
    }
}
