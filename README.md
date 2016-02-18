# iDAI.field 2 Client

## Development

### Prerequisites

You need the following components in order for the local server to work:

* [NodeJS](https://nodejs.org/download/)
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Under OS X you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build windows packages.

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
gulp server
```

This should open the app in a separate window.

Any changes made to HTML, SCSS or JS files should automatically trigger a reload.

## Deployment

Build the iDAI.field 2 Client application by running

```
gulp
```

After building you find packages of the application for different operating systems
in the "release"-directory. 

## Unit-Testing

The following dependencies are required for unit testing:

```
npm install -g karma
npm install -g karma-jasmine
npm install -g karma-chrome-launcher
```

To run the unit tests, you have to open one terminal and run 

```
ulimit -n 10000
gulp test-watch
```

Then open another terminal and run

```
gulp test
```

