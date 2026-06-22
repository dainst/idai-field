This package contains the mobile client for Field. The app is developed in [React Native](https://reactnative.dev/) and the [Expo CLI](https://expo.dev/).

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Build the shared core package from the repository root:

   ```bash
   cd ../core
   npm install
   npm run build
   ```

2. Install mobile dependencies:

   ```bash
   cd ../mobile
   npm install
   ```

The async storage adapter is pinned to a public GitHub commit in `package.json`.
No local `yalc` package is required.

3. Start the development build

   ```bash
   npx expo start --dev-client --host localhost
   ```

Expo Go is not supported for this app because the project uses native modules.
Use a development build or a standalone Android APK.

## Android tablet APK

From the repository root on Windows:

```powershell
.\build-idai-field-android-apk.ps1 -Variant release
.\install-idai-field-android-apk.ps1 -ApkPath .\dist\android\idai-field-mobile-release.apk
```

For USB development on an installed development build:

```powershell
.\run-idai-field-tablet-ko.ps1 -InstallDebug
.\run-idai-field-tablet-ko.ps1
```

Korean installation notes for field users are in
[`docs/korean-fieldwork/android-tablet-install.ko.md`](../docs/korean-fieldwork/android-tablet-install.ko.md).

## Run iOS

   ```bash
   npm run ios
   ```
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

You can start developing by editing the files inside the **mobile** directory.

This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Development notes

### Linting

Run eslint with

```bash
npm run lint
```
