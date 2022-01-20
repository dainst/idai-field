# iDAI.field

This is a monorepo containing five packages:

* [iDAI.field Desktop](desktop): The iDAI.field desktop client based on AngularJS and Electron
* [iDAI.field Mobile](mobile): The iDAI.field mobile client based on React Native
* [iDAI.field Server](server): Server components
* [iDAI.field Web](web): The iDAI.field Web publication platform
* [iDAI.field Core](core): Shared TypeScript modules

## Development

The repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependecies.
When first checking out the code base, bootstrap the dependencies with:

    $ npm run bootstrap

Refer to the sub-package READMEs for detailed instructions on how to set up individual
development environments.
