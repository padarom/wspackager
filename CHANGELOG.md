## **v1.5.0** (2022-07-?)
- Add support for the `<void/>` package instruction

## **v1.4.0** (2022-04-21)
Thanks to @Sir-Will for these additions!

- Add main file for usage in node scripts
- Add option to define source directory
- Add basic jest tests
- Updat all dependencies
- Add .tar.gzip output

## **v1.3.1** (2017-05-05)
- Fix a bug that includes an empty directory in the resulting package

## **v1.3.0** (2017-05-04)
- Replace some of the manual path separation in the packager with code using node's `path` module
- Add the `-d/--destination` command line option to specify the destination of the package

## **v1.2.1** (2017-03-18)
- Fix bug where `style.xml` file options with attributes weren't loaded

## **v1.2.0** (2017-03-18)
- Add support for intermediate packages that should not be packaged into the final archive (only via styles)
- Extend support for the `style` PIP that also reads the `style.xml` and packages its files as well

## **v1.1.0** (2017-02-18)
- Added additional default file names for XML based PIPs

## **v1.0.5** (2017-01-27) (+ **v1.0.6**)
- Fixed a bug where folders wouldn't be packaged on Windows

## **v1.0.3** (2017-01-14)
- Change main file to `lib/gulp/wspackager.js` in first step to create a gulp plugin
- Parse `optionalpackage` and `requiredpackage` xml tags and also package the archives specified by them
