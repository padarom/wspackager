# WCF Utils [![npm](https://img.shields.io/npm/v/wcfutils.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/wcfutils)
A small library that handles WCF package development utility functions for you. Automatically checks your cwd for a `.wcfutil.yml` which serves as a configuration file for the tasks that you want to run.

## Installation
Run `npm install -g wcfutils` to install the package globally and have its binary added to your PATH.

## Usage
Create a `.wcfutil.yml` in your working directory and run `wcfutils`.

Examples for the configuration file can be found in `examples/` and will be further documented at a later point.

### Possible tasks
Currently only one task is implemented:

- [x] Packaging (`package`)
- [ ] Suggestions for new tasks? [Create an issue!](https://github.com/Padarom/WCF-Utils/issues/new)

### Packaging task
```yaml
packaging: # The task
    destination: com.example.plugin.tar # The destination file name
    files:
        exclude: # Files or folders that should not show up in the created package
            - README.md
            - .travis.yml
            - .git
        tarball: # Directories that should be tarballed themselves
            - templates
            - files
            - acpTemplates: acptemplate
            # You can also specify that the source and destination name
            # should be different: "acpTemplates" gets tarballed into "acptemplate.tar"
```
You can also specify that you want to run multiple packaging tasks like so:
```yaml
packaging:
    -
        destination: com.example.plugin.1.tar
        base: plugin-1
        files:
            # ...
    -
        destination: com.example.plugin.2.tar
        base: plugin-2
        files:
            # ...
```
This example would not use the current working directory as its base path, but the manually specified `base` (can also be absolute).