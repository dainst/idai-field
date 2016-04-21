# iDAI.field 2 Client

## Development

### Prerequisites

You need the following components in order for the local server to work:

* [NodeJS](https://nodejs.org/download/)
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Under OS X you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build windows packages.

Install the following npm packages globally:

```
npm install -g gulp
npm install -g typings
npm install -g karma
npm install -g karma-jasmine 
npm install -g phantomjs 
npm install -g karma-phantomjs-launcher
npm install -g karma@canary
```

### Installation

To install the necessary dependencies for the app run the following command in the working directory:

```
git clone https://github.com/codarchlab/idai-field-client.git
cd idai-field-client
npm install
```

### Running the development server

In order to run the frontend in the development server use the following command:
```
npm start
```

This should open the app in a separate window.

Any changes made to HTML, SCSS or JS files should automatically trigger a reload.

## Deployment

The recommended way for building and testing 
the iDAI.field 2 Client application is as follows

```
npm run build-and-test
npm run e2e-and-package
```

Note that in order the e2e tests to work, the dist dir has to be served
on localhost:8081. If you have now webserver serving this directory, you also
can use 'npm run e2e-server' from another terminal.

After building you find packages of the application for different operating systems
in the "release"-directory. 

## Testing

### Unit - Testing

To run the unit tests, you need two open two terminals. 

#### 1:

```
ulimit -n 10000
npm start (this starts the app but we only use it because the watch task is triggered with it) 
```

#### 2:

```
npm test 
```

### E2E - Testing

Again, you need two terminals. 
Note that a proper build is necessary for this to work. 
Do a 'npm run build-and-test' prior to e2e testing.

#### 1:

```
npm run e2e-server
```

#### 2:

```
npm run e2e
```

