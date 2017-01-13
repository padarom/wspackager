# WoltLab Suite Packager [![npm](https://img.shields.io/npm/v/wspackager.svg?style=flat-square)](https://www.npmjs.com/package/wspackager)  [![npm](https://img.shields.io/npm/dt/wspackager.svg?style=flat-square)](https://www.npmjs.com/package/wspackager)
A small library that handles WCF/WSC packaging for you. It automatically analyses the instructions in your `package.xml` to determine which files to package. You won't need to create any additional configuration files or adjust the way you work. Simply follow some very basic guidelines and run the program.

## Installation and Usage
Run `npm install -g wspackager` to install the package globally and have its binary added to your PATH.

Once installed, simply run `wspackager` in the same folder that your packages `package.xml` is at.

![Tree diagram](/assets/tree.png?raw=true "Tree diagram of your plugin")

### Project structure
`wspackager` will analyze your `package.xml` to only package files that are required for your specified instructions. In cases where the instruction asks for a `.tar` archive it is assumed that you have a folder with the same name in your projects root directory (e.g. if you're using the instruction `<instruction type="file">files.tar</instruction>` it will attempt to package the folder `files` to make `files.tar`).

If a file you specified in your instructions does not exist, the program will exit and alert you.

## Why choose this one over other packagers?
- No configuration required
- Folder structure independent (_no need to adjust your workflow_)
- Plugin-aware packaging (_it only packages what your package instructions need_)
- Compatible with WSC3.0 and default PIP filenames
- Almost 1300 downloads of the predecessor packages [wcfutils](https://www.npmjs.com/package/wcfutils) and [wcf-utils](https://www.npmjs.com/package/wcf-utils) on npm
- Doesn't require user-interaction and works well for CI (_visit the [Wiki](https://github.com/padarom/wspackager/wiki) for an example setup_)

## Options
There's several options you can run this program with, which shall be listed below.

#### `--gzip` (`-g`)
The default archive format used is `.tar`. You can use this option if you want or need to package to a `.tar.gz` archive instead.

#### `--pip [name=file]`
wspackager works by analyzing your `package.xml` file and the install instructions in it. If using WSC3, you can omit file- or folder names if these are the same as the PIPs default value. This does not work if your package relies on any 3rd party PIPs and uses their default values. In that case, you need to specify these PIPs and their default values.

**Example**
```xml
<instruction type="template" /> <!-- This is understood, as it's a default PIP -->
<instruction type="banana" /> <!-- This is a 3rd party PIP -->
```
If the default value of the `banana` PIP was `banana.xml` or `banana.tar` you would need to run the program like so respectively:
```sh
$ wspackager --pip banana=banana.xml
$ wspackager --pip banana=banana.tar
```
In case you use multiple 3rd party PIPs, you can also stack this parameter like so:
`wspackager --pip banana=banana.xml --pip foo=bar.xml`

#### `--quiet` (`-q`)
wspackager normally outputs the resulting package structure so you can verify your package has the content it should have without unpacking it. If you don't want the program to output anything, use the quiet option.
