# WoltLab Suite Packager
A small library that handles WCF/WSC packaging for you. It automatically analyses the instructions in your `package.xml` to determine which files to package. You won't need to create any additional configuration files or adjust the way you work. Simply follow some very basic guidelines and run the program.

## Installation
Run `npm install -g wspackager` to install the package globally and have its binary added to your PATH.

## Usage
Simply run `wspackager` after having installed it globally. _That's all._

If you wish to see the resulting package structure before actually packaging, run it with the parameter `--dry-run` (`-d`).

This tool packages to a `.tar` archive by default. If you need to package it as a `.tar.gz` instead, simply use the parameter `--gzip` (`-g`)
