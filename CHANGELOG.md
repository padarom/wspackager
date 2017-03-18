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
