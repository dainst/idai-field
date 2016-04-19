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
gulp run
```

This should open the app in a separate window.

Any changes made to HTML, SCSS or JS files should automatically trigger a reload.

## Deployment

Build and package the iDAI.field 2 Client application by running

```
gulp
gulp package
```

After building you find packages of the application for different operating systems
in the "release"-directory. 

## Testing

### Unit - Testing

To run the unit tests, you need two open two terminals. 

#### 1:

```
ulimit -n 10000
gulp clean
gulp run (this starts the app but we only use it because the watch task is triggered with it) 
```

#### 2:

```
npm test
```

### E2E - Testing

Again, you need two terminals. 

#### 1:

```
gulp clean
gulp webserver-watch
```

#### 2:

```
npm run e2e
```

