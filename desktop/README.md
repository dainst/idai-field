# Field Desktop

Field Desktop is a modern take on flexible field and find recording for archaeological excavations. It is developed as a cooperation between the German Archaeological Institute ([DAI](https://www.dainst.org)) and the Head Office of the GBV Common Library Network ([GBV](https://en.gbv.de/)). Field Desktop is completely Open Source and free to use!

## Usage

Please refer to the [wiki](https://github.com/dainst/idai-field/wiki).
   
## Development

Development of Field Desktop works under **MacOS**, **Windows** and **Linux**. In any case, before you start, make sure you have [NodeJS](https://nodejs.org/en/) 20.18 as well as Node Package Manager ([NPM](https://www.npmjs.com/)) installed.  

Then clone this repository locally and run the following commands (in the repository root):

```
$ npm run bootstrap
$ cd core
$ npm run build
$ cd ../desktop
$ npm start
```

`npm run bootstrap` sets up and fetches the necessary dependencies, while `npm start` compiles the Angular app and starts it via Electron.

### Troubleshooting

If the application does not start in an arm64 environment (e. g. Apple Silicon), set this NPM configuration parameter before bootstrapping the application:
```
$ npm config set cpu=arm64
```

There seems to be an issue with `lerna bootstrap` that prevents running install scripts in dependencies. Use the following commands to run necessary scripts manually as a workaround:

```
$ node node_modules/electron/install.js
$ node node_modules/electron-chromedriver/download-chromedriver.js
```

## Tests

The app must have been built (`npm run build:test`) before running the tests.

To execute the **unit tests**, run 

```
$ npm test   
```

The project is set up to manage the compilation of the sources (test as well as regular sources) independently from Angular. This is due to the fact that we perform Node based tests, since our code runs in an Electron context. This is done on the 
basis of `test/tsconfig.json` and `jasmine`. To rebuild the sources for tests continually, you can run `npm run build:test+watch` in one terminal window, and `npm test` in another.

For troubleshooting information see [here](docs/unit-test-troubleshooting.md).

To execute **e2e tests**, run 

```
$ npm run e2e
```

To execute **integration test with Field Hub**, run

```
$ npm run test:hub-integration --prefix desktop
```

The Field Hub integration tests require installed Docker.

## Packaging

To create binaries run (in repository root):

```
$ npm run build
$ cd desktop
$ npm run package:[mac|win|lnx]
```

Only packages for the selected target platform are created. When the command has finished execution, you find packages of the application in the `release` directory.

Please note that when using **Windows**, due to nested node_modules and the 
windows default maximum path length you might be running into errors while attempting
to extract the package. In that case, please use a different archiver, for example [7-Zip](http://www.7-zip.org/download.html).

