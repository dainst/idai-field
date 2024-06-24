# Field Mobile

This package contains the mobile client for Field.
The app is developed in [React Native](https://reactnative.dev/) and the [Expo CLI](https://expo.io/).

## Development

Use the following commands to run the app for development in the browser (in the repository root):

```
    $ npm run bootstrap
    $ cd core
    $ npm run build
    $ cd ../mobile
    $ npm install --global expo-cli
    $ npm start
```

## Run on (virtual) device

First run 

    $ npm start

to start expo cli. From here you can open the app on your mobile device by scanning displayed QR code. Or you can run the app on virtual devices (using Xcode or Android Studio simulators)

## Use Debugger in VSCode (Tested only with iOS devices)

1. Download [React Native Tools](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native) extension.
2. Launch "Debug in Exponent"
3. Scan QR code on your real device
4. Enable Remote Debugging on your device

## Use React Native Debugger (Tested only with iOS devices)

1. Download [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Open React Native Debugger and press Cmd + T to open new tap
3. Select port 19001
4. Start expo app with expo start or npm start
5. Open App on simulator or device and enable remote debugging
6. React Native Debugger should connect to your application

The source files to set the brakpoints are quite hidden in the React Native Debugger application. You can find them here: <br/>
Sources -> RNDebuggerWorker.js -> 127.0.0.1:9001

## Testing

After bootstrapping the app use the following command to run the tests:

    $ npm test
