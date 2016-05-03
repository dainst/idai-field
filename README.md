# iDAI.field 2 Client

## Development

### Installation

You need the following components in order for the local server to work:

* [NodeJS](https://nodejs.org/download/)
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Under OS X you need [Wine](http://www.davidbaumgold.com/tutorials/wine-mac/) to build windows packages.

Install the following npm packages globally:

```
npm install -g typings
npm install -g karma  # only necessary if you need to run karma directly from the command prompt
npm install -g gulp   # only necessary if you need to debug gulp commands from the command prompt
```

If that is done, install the necessary dependencies 
for the app run the following command in the working directory:

```
git clone https://github.com/codarchlab/idai-field-client.git
cd idai-field-client
npm install
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

#### Background

The reason for this is that developers can experiment with different configurations locally
without risking of committing actual real configurations to the repo. This is achieved by gitignoring 
the files ending on .json. 

This is important
of course for security reasons, but here it is also necessary because the .template
configurations are the ones proven to work for the e2e tests.

**Note** that if the e2e tests do pass, provide the .template configuratons and test again.

Maybe you have noted that the file names 

```
src/main/config/config.json.deploy
src/main/config/Configuration.json.deploy
```

are also gitignored. This is because these are files which are 
provided by the build system for packaging and deployment.


### Starting the app

In order to run the frontend in the development server use the following command:

```
npm start
```

This should open the app in a separate window.

Any changes made to any source files trigger automatic recompilation
of processes and a final reload of the application.


## Testing

### Unit - Testing

To run the unit tests in a continuous manner, 
you need two open two terminals (marked as '1$' and '2$'). 

```
1$ ulimit -n 10000
1$ npm start
```

The *npm start* starts the app, but whats more important for us here is,
that it watches the sources, and everytime anything changes, the sources
are recompiled.

```
2$ npm run test-loop
```

This causes karma to run continuously. And since the sources are also watched
continuously, you can edit and test at the same time.

### E2E - Testing

Note that, asides from the existence of config files (see [here](#configuration)),
a prior build is necessary for the e2e tests to work. So make sure
you build the source using one of the following two commands.
While the first one builds and tests, the second one can be used to
skip testing.

```
npm test
npm run build
```

For starting end to end testing,
you need two terminals (again marked as '1$' and '2$').

```
1$ npm run server
```

This starts a webserver which serves the dist/main directory on port 8081
which is from where it is loaded into the browser against which the tests are run.
Furthermore, a 'watch' process runs. It causes to recompile the sources anytime changes
are made, similar to the behaviour of 'npm start'.

```
2$ npm run e2e
```

This command runs the end to end tests once. While changes of sources are recompiled
automatically, tests have to be triggered on demand, unlike the behaviour of
'npm run test-loop', which runs continuously.

## Deployment

The recommended way for building and testing
the iDAI.field 2 Client application is as follows

```
1$ npm test
(2$ npm run server)
1$ npm run e2e
1$ npm run package
```

As described above, in order for the e2e tests to work, the dist dir has to be served
on localhost:8081. This is what the command in parentheses is for. If you are on a ci machine
 and have another webserver, like for example apache2, serving this directory on 8081, you
can omit this command.

After building you find packages of the application for different operating systems
in the "release"-directory.
