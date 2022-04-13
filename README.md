# iDAI.field

This is a monorepo containing five packages:

* [Field Desktop](desktop): The Field Desktop client based on AngularJS and Electron
* [Field Mobile](mobile): The Field Mobile client based on React Native
* [Field Server](server): The FieldHub server application
* [Field Core](core): Shared TypeScript modules
* [iDAI.field Web](web): The iDAI.field Web publication platform


## Development

The repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependecies.
When first checking out the code base, bootstrap the dependencies with:

    $ npm run bootstrap

Refer to the sub-package READMEs for detailed instructions on how to set up individual
development environments.
