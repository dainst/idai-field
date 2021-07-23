# iDAI.field Core

This package containes shared code for the different iDAI.field packages.

Generally there should be no need to build this package separately since its
dependencies are installed and it is built when running `npm run bootstrap`
and `npm run build` in the repository root.

## Development

Trigger build manually, such that other projects have access to the latest changes

    $ npm run build 

Run tests

    $ npm t

Continuously watch and test

    $1 npm run build:watch
    $2 npm run test:watch
