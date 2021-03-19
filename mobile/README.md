# iDAI.field Mobile

This package contains the mobile client for iDAI.field.

## Development

Use the following commands to run the app for development in the browser (in the repository root):

    npm run bootstrap
    cd mobile
    npm start

## Run on (vritual) device

You can use the corresponding IDE (Android Studio or XCode) to run the app on Android and iOS devices
or simulators.

First you need to build the app with

    npm run build

Then copy the resulting web files and any native dependencies with

    npx cap sync

You can then open the corresponding IDE with

    npx cap open android

or

    npx cap open ios
