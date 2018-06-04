# iDAI.field 2

![idai-field](img/README-FEATURES-1.png) 
   
   
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
   
   
## Quickstart

Development of iDAI.field works under **MacOS**, **Windows** and **Linux**. In any case, before you start, make sure you have [NodeJS](https://nodejs.org/en/) > 7.0.0 as well as Node Package Manager ([NPM](https://www.npmjs.com/)) installed.  

Then clone this repository locally and run the following commands:

```
$ npm install
$ npm run build
$ npm start
```

`npm install` fetches the necessary dependencies. `npm run build` compiles the typescript files, creates [configuration](config/README.md) files, gathers the necessary fonts and converts scss files. `npm start` starts the electron app. For a fast development workflow it is recommended to set up your IDE to compile the typescript files continuously while you are 
 working on the sources. That way you can just hit reload to see changes made to the *.ts* or *.html* files.

See also [idai-components-2](https://github.com/dainst/idai-components-2).

## Tests

The app must have been built (`npm run build`) before running the tests.

To execute the **unit tests**, run 

```
$ npm test   
```

For troubleshooting information see [here](docs/unit-test-troubleshooting.md).

To execute **e2e tests**, run 

```
$ npm run e2e [noff|ff]
```

The optional fail fast parameter specifies if test execution stops on the first error (`ff`) or continues until all tests are finished (`noff`). If not specified, the default mode is `noff`. 

## Packaging

To create binaries run:

```
$ npm run package[-mac|-win]
```

Without using one of the specified suffixes, this will create packages for both **MacOS** and **Windows** 32/64 bit.
If used with one of the suffixes, only packages for the selected target platform get created. When the command has finished execution, you find packages of the application for different operating systems in the `release` directory.

Please note that when using **Windows**, due to nested node_modules and the 
windows default maximum path length you might be running into errors while attempting
to extract the package. In that case, please use a different archiver, for example [7-Zip](http://www.7-zip.org/download.html).

When using **MacOS**, you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build Windows [packages](https://github.com/dainst/idai-field-client/blob/master/README.md#packacking).

Note that creating **Linux** packages should be possible with electron, but this is yet untested and not enabled.


