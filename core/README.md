# iDAI.field Core

This package containes shared code for the different iDAI.field packages.

Generally there should be no need to build this package separately since its
dependencies are installed and it is built when running `npm run bootstrap`
and `npm run build` in the repository root.

However, builds can manually be triggered with

    $ npm run build

or 

    $ npm run build:watch

to do it continuously.

To run unit tests, use

    $ npm t
