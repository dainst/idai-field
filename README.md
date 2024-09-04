# iDAI.field | Field <a href='https://field.idai.world/'><img src='/desktop/img/logo.png' align="right" height="200" /></a>

<!-- badges: start -->
[![latest release](https://img.shields.io/github/v/release/dainst/idai-field)](https://github.com/dainst/releases)
[![Manual](https://img.shields.io/badge/Manual-field.idai.world-green)](https://field.idai.world/manual)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/dainst/idai-field/total)
<!-- badges: end -->

Field is the German Archaeological Institutes take on digital field and find recording. For an overview of the genesis and the idea behind Field, check out one of our latest articles: 

S. Hohl – T. Kleinke – F. Riebschläger – J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, AeC 34, 1, 2023, 85–94, doi: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10).

Using Field, archaeologists can: 

* record, share and store all data and images produced on the excavation
* customize their own data model on top of a minimal shared model as defined by Field
* locate all of their records on a map
* manage types and inventories
* sync & publish their excavation data

## Information for developers and collaborators

This is a monorepo containing five packages:

* [Field Desktop](desktop): The Field Desktop application based on Angular and Electron
* [Field Mobile](mobile): The Field Mobile application based on React Native (early development, no release yet)
* [Field Hub](server): The (optional) synchronisation server application.
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
