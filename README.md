# iDAI.field 2 Client

## Prerequisites

You need the following components in order for the local server to work:

* [NodeJS](https://nodejs.org/download/)
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Under OS X you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build windows packages.

Install the following npm packages globally:

```
$ npm install -g typings
$ npm install -g karma  # only necessary if you need to run karma directly from the command prompt
$ npm install -g gulp   # only necessary if you need to debug gulp commands from the command prompt
```

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

`npm start` opens the app in a new browser window. The command  starts the application and takes care that changes made to scss files result in automatic conversion to css.

## Configuration

Prior to starting or e2e testing the app, it is necessary that config files are provided.
`npm run build` does this automatically for you. Detailed information on how the app can be 
configurated can be found [here](config).

## Testing

### Unit - Testing

Before running the tests, the app must have been build and an appropriate 
`ulimit` has to set for karma to run properly.

```
$ npm run build
$ ulimit -n 10000
```

To run the tests, execute one of the following commands

```
$ npm test      # runs tests once
$ npm test:loop # runs tests continuously
```

This second command runs the tests in a loop and is useful,
when the sources are automatically recompiled on every change, as for example IntelliJ does.

### E2E - Testing

The e2e tests are configured to work with the **chrome/chromium** browsers only, 
so make sure there is a local installation of one of these. The *chrome/chromium* only policy
is sufficient since the final app is supposed to run under chrome only, packaged as an electron app.

**Note** that provision of config files (see [here](config)) is a precondition for being able to run and e2e test the application successfully.

Asides from that, a prior build is necessary for the e2e tests to work. For that, run

```
$ npm run build
```

For starting end to end testing,
you need two terminals (marked as '1$' and '2$').

```
1$ npm run server
```

This starts a webserver which serves the ./ directory on port 8081
which is from where it is loaded into the browser against which the tests are run.
As the *start* command, it automatically converts scss files to css when they are changed.

```
2$ npm run e2e
```

This command runs the end to end tests once.

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
in the "release"-directory.
