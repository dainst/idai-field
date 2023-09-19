# iDAI.field

This is a monorepo containing five packages:

* [Field Desktop](desktop): The Field Desktop application based on Angular and Electron
* [Field Mobile](mobile): The Field Mobile application based on React Native (early development, no release yet)
* [FieldHub](server): The (optional) synchronisation server application.
* [Field Core](core): Shared TypeScript modules
* [iDAI.field Web](web): The iDAI.field Web publication platform

## Usage

Please refer to the [wiki](https://github.com/dainst/idai-field/wiki).

## Development

The repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependecies.
When first checking out the code base, bootstrap the dependencies with:

    $ npm run bootstrap

Refer to the sub-package READMEs for detailed instructions on how to set up individual
development environments.
