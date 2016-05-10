# iDAI.field 2 Client

## Development

### Installation

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

If that is done, install the necessary dependencies 
for the app run the following command in the working directory:

```
$ git clone https://github.com/codarchlab/idai-field-client.git
$ cd idai-field-client
$ npm install
```

### Configuration

Prior to starting or e2e testing the app, it is necessary that config files are provided.
It is expected that the files

```
src/main/config/config.json
src/main/config/Configuration.json
```

exist. For that purpose you can simply take the files

```
src/main/config/config.json.template
src/main/config/Configuration.json.template
```

and create copies of them cutting the .template suffix.

The reason for this is that developers can experiment with different configurations locally
without risking of committing actual real configurations to the repo. This is achieved by gitignoring 
the files ending on .json. Maybe you have noted that the file names 

```
src/main/config/config.json.deploy
src/main/config/Configuration.json.deploy
```

are also gitignored. This is because these are files which are 
provided by the build system for packaging and deployment.


### Starting the app

Before you can start your app, the typescript files have to be compiled.
Make sure your IDE is configured accordingly or run

```
$ npm run build
```

In order to run the application:

```
$ npm start
```

This should open the app in a separate window. 

The command builds (cleaning any rests from any prior builds)
and starts the application. From then on, changes made to scss files
result in automatic conversion to css.

## Testing

### Unit - Testing

To run the unit tests in a continuous manner, 
you need two open two terminals (marked as '1$' and '2$'). 

Before running the tests, you need to make sure the
app is build:

```
$ npm run build
```

Also karma may require that a higher ulimit is set.

```
$ ulimit -n 10000
```

To run the tests once, execute

```
$ npm test
```

To run them in a loop, execute

```
$ npm test:loop
```

This is useful, when the sources are automatically recompiled on every change,
as for example IntelliJ does.

### E2E - Testing

Note that provision of config files (see [here](#configuration)) is a precondition for being able to run and e2e test the application successfully.
Although other configurations may work too, the .template suffixed
files below src/main/config are the ones proven to work.

**Note** that if the e2e tests do not pass, provide the .template configuratons and test again.

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

```
2$ npm run e2e
```

This command runs the end to end tests once.

**Important**

For reasons of a convenient development workflow, the *run server* task makes the tests
test against the application development files under "./". On a continuous integration machine,
however, what you want is that the application, as it is packaged, is tested. So make sure
you use

```
$ npm run prepare-package
```

there and server the dist dir (instead of ./) on 8081, so that the target application is the 
one you run your e2e tests against.

## Deployment

The recommended way for building and testing
the iDAI.field 2 Client application on a developer machine is as follows

```
1$ npm run build
1$ npm test
2$ npm run server
1$ npm run e2e
1$ npm run prepare-package
1$ npm run package
```

For reasons mentioned at the end of the previous section, the recommended way for building and testing
the iDAI.field 2 Client application on a continuous integration machine differs a little bit and 
is as follows

```
$ npm run build
$ npm test
$ npm run prepare-package
$ npm run e2e
$ npm run package
```

In this case it is assumed the dist dir is served at localhost:8081 by a webserver like apache.

After building you find packages of the application for different operating systems
in the "release"-directory.
