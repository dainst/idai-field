[![Mac build](https://img.shields.io/travis/dainst/idai-field-client/master.svg?label=mac%20build)](https://travis-ci.org/dainst/idai-field-client)
[![Windows build](https://img.shields.io/appveyor/ci/dainst/idai-field-client/master.svg?label=windows%20build)](https://ci.appveyor.com/project/dainst/idai-field-client)


# iDAI.field 2 Client


## Documentation

A User Manual with documented workflows and usage is available here:
[User Manual](https://github.com/dainst/idai-field-documentation)

Admin Documentation:
[Documentation](docs/README.md) 
   
## Prerequisites

The iDAI.field2 development stack runs under MacOS, Windows, Linux. 

You need the following components in order for the local server to work:

* [NodeJS](https://nodejs.org/en/) > 7.0.0
* Node Package Manager ([NPM](https://www.npmjs.com/)) 
* Under OS X you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build windows [packages](https://github.com/dainst/idai-field-client/blob/master/README.md#packacking).

## Quickstart

Clone this repository locally and run

```
$ npm install
$ npm run build
$ npm start
```

`npm run build` compiles the typescript files and creates [configuration](config/README.md) files.
The typescript files are compiled once, so it is recommended to configure your IDE to 
do that continuously in the background for you.

`npm start` start the electron app. Besides starting the application the command takes 
care that changes made to scss files result in automatic conversion to css.

## Unit - Testing

The app must have been build (`npm run build`) before running the tests.
To execute the tests, run 

```
$ npm test   
```

[Troubleshooting](docs/unit-test-troubleshooting.md)

## E2E - Testing

The app must have been build (`npm run build`) before running the tests.
To execute the tests, run 

Test execution can be started

```
$ npm run e2e
```

This command runs all end to end tests once. To alter this behaviour, you can use the `ff` option (fail fast)

```
$ npm run e2e ff
```

so that test execution stops when the first error is found. 

Additionally, there is a (not yet) stable syncing test suite, which can be started with

```
$ npm run e2e (no)ff flaky
```

## Packaging

To create binaries run 

```
$ npm run package
```

This will create packages for MacOs and Windows 32/64 bit.
Linux is possible with electron but here this is yet untested and not enabled.

To package only for mac, use

```
$ npm run package-mac
```

To package only for windows, use

```
$ npm run package-win
```

Please note that when using windows, that due to nested node_modules and the 
windows default maximum path length you might be running into errors while attempting
to extract the package. In that case, please use a different archiver, for example [7-Zip](http://www.7-zip.org/download.html).

Afterwards you find packages of the application for different operating systems
in the `release`-directory.


