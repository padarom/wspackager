# WoltLab Suite Packager
A small library that handles WCF/WSC packaging for you. It automatically analyses the instructions in your `package.xml` to determine which files to package. You won't need to create any additional configuration files or adjust the way you work. Simply follow some very basic guidelines and run the program.

## Installation and Usage
Run `npm install -g wspackager` to install the package globally and have its binary added to your PATH.

Once installed, simply run `wspackager`.

## Options
There's several options you can run this program with, which shall be listed below.

- `--pretend` (`-p`)
wspackager simply outputs the resulting package structure, but don't actually performs the packaging. You can use this to test whether your application is going to be correctly packaged beforehand.

- `--gzip` (`-g`)
The default archive format used is `.tar`. You can use this option if you want or need to package to a `.tar.gz` archive instead.

- `--pip [name=file]`
wspackager works by analyzing your `package.xml` file and the install instructions in it. If using WSC3, you can omit file- or folder names if these are the same as the PIPs default value. This does not work if your package relies on any 3rd party PIPs and uses their default values. In that case, you need to specify these PIPs and their default values.

#### Example
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
