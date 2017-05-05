[![Tests](https://img.shields.io/jenkins/s/http/bogusman03.dai-cloud.uni-koeln.de:8080/job/idai-field-client.svg?label=tests)]()
[![Mac build](https://img.shields.io/travis/dainst/idai-field-client/master.svg?label=mac%20build)](https://travis-ci.org/dainst/idai-field-client)
[![Windows build](https://img.shields.io/appveyor/ci/dainst/idai-field-client/master.svg?label=windows%20build)](https://ci.appveyor.com/project/dainst/idai-field-client)


# iDAI.field 2 Client
  
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

`npm run build` compiles the typescript files and creates configuration files.
The typescript files are compiled once, so it is recommended to configure your IDE to 
do that continuously in the background for you.

`npm start` start the electron app. Besides starting the application the command takes 
care that changes made to scss files result in automatic conversion to css.

## Configuration

Prior to starting or e2e testing the app, it is necessary that config files are provided 
(`npm run build` does this automatically for you when the repo is cloned freshly, but detailed information on how the app can be configurated can be obtained from [here](config)).

## Unit - Testing

The app must have been build (`npm run build`) before running the tests.
To execute the tests, run 

```
$ npm test   
```

### Troubleshooting

Before running the tests, it might be necessary that an appropriate 
`ulimit` has to set for karma to run properly.

```
$ ulimit -n 10000
```

It is necessary that the config files (`config/`) exist (which should
be the case after running `npm run build`) when running the unit tests. 
Otherwise this will lead to some
strange behaviour of the test runner with an output like

```
24 01 2017 18:49:13.383:WARN [web-server]: 404: /base/config/config.json
Chrome 55.0.2883 (Mac OS X 10.12.0) ERROR: Error{originalErr: Error{}}
```

which can be a result of custom json loading as it is done from within `IndexeddbDatastore`
using `app/util/systemjs-json-plugin`.

It is strongly recommended that it is grepped for WARN and ERROR when doing CI,
since both of them will not lead to an exit code other than `0`.

## E2E - Testing

**Note** that provision of config files (see [here](config)) is a precondition for being able to run and e2e test the application successfully.

Test execution can be started

```
2$ npm run e2e
```

This command runs all end to end tests once. To alter this behaviour, you can use the `ff` option (fail fast)

```
2$ npm run e2e ff
```

so that test execution stops when the first error is found. 




## Packaging

To create binaries run 

```
$ npm run dist 
```

This will create packages for MacOs and Windows 32/64 bit.
Linux is possible with electron but here this is yet untested and not enabled.

Please note that when using windows, that due to nested node_modules and the 
windows default maximum path length you might be running into errors while attempting
to extract the package. In that case, please use a different archiver, for example [7-Zip](http://www.7-zip.org/download.html).

## Deployment

The recommended way for building and testing
the iDAI.field 2 Client application on a developer machine is as follows

```
1$ npm run build
1$ npm test
2$ npm run server
1$ npm run e2e
1$ npm run make-dist 
1$ npm run package
```

After building you find packages of the application for different operating systems
in the `release`-directory.
