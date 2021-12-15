# iDAI.field Desktop
 
![idai-field](img/README-1.png) 
    
   
The German Archaeological Institute’s ([DAI](https://www.dainst.org)) 
new take on a field research 
documentation system. Combining [features](README-FEATURES.md) of GIS, photo management, and 
database management systems in a unique and integrating manner, 
it aims at facilitating archaeological workflows by reducing the overhead 
of using multiple systems. Developed in-house by the DAI’s information 
technology department, it targets primarily the needs of the institute’s 
excavations, older ones as well as those to come. Yet, due to the nature 
of its adjustable data model and the fact it is open source software, any 
interested third party is free to reuse and adjust it to their needs.
   

## Installation

You can install the latest version of iDAI.field by downloading it from the [github releases page](https://github.com/dainst/idai-field/releases/latest) or the [idai-field homepage](http://field.dainst.org). Choose the installer for your operating system (**MacOS**, **Windows** or **Linux**).

   
## Development

Development of iDAI.field works under **MacOS**, **Windows** and **Linux**. In any case, before you start, make sure you have [NodeJS](https://nodejs.org/en/) >= 14 as well as Node Package Manager ([NPM](https://www.npmjs.com/)) installed.  

Then clone this repository locally and run the following commands (in the repository root):

```
$ npm run bootstrap
$ npm run build
$ cd desktop
$ npm start
```

`npm run bootstrap` sets up and fetches the necessary dependencies, while `npm start` compiles the Angular app and starts it via Electron.

There seems to be an issue with `lerna bootstrap` that prevents running install scripts in dependencies. Use the following commands to run necessary scripts manually as a workaround:

```
$ node node_modules/electron/install.js
$ node node_modules/electron-chromedriver/download-chromedriver.js
```
 
Shapefile import/export is handled by a Java command line tool which is called by the Electron app. If Java 8 or higher and [Maven](https://maven.apache.org/) are installed, the Java tool can be built via the command:
```
$ npm run build:java
```

See also [idai-components-2](https://github.com/dainst/idai-components-2).

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
