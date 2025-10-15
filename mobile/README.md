This package contains the mobile client for Field. The app is developed in [React Native](https://reactnative.dev/) and the [Expo CLI](https://expo.dev/).

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Install pouchdb-async-storage-adapter
   The old pouchdb asyncstorage adapter [here](https://github.com/seigel/pouchdb-react-native/tree/master/packages/pouchdb-adapter-asyncstorage) is no longer maintained nor it updated with the latest version of pouchdb. 
   instead we are using an updated fork which at the time of writing this document is not yet clear what would be the final name/url for this package and thus needs to be installed locally for now using [yalc](https://www.npmjs.com/package/yalc).
   1. in a separate folder clone the fork `git clone git@github.com:neighbourhoodie/pouchdb-asyncstorage-adapter.git`
   2. `cd pouchdb-asyncstorage-adapter`
   3. `npx yalc publish`
   4. go back to mobile app folder and run `npx yalc add @neighbourhoodie/pouchdb-asyncstorage-adapter`
      this will link the adapter so it can be bundled with the app.
      if you get this error while building the app after an npm install 
      ```
            38 | type Registry<TEventToArgsMap: {...}> = {
            > 39 |   [K in keyof TEventToArgsMap]: Set<Registration<TEventToArgsMap[K]>>,
            |      ^
         40 | };
         41 |
         42 | /**]
      ``` you need to run `npx yalc add @neighbourhoodie/pouchdb-asyncstorage-adapter` again after npm install.

3. Start the app

   ```bash
    npx expo start
   ```
2. Run iOS
   ```bash
   npm run ios
   ```
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **mobile** directory.

This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Development notes

### Linting

Run eslint with

```bash
npm run lint
```