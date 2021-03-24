const {notarize} = require('electron-notarize');


exports.default = async function performNotarization(context) {

    if (process.env.MAC_NOTARIZE !== 'true') return;

    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') return;

    console.log('Performing notarization ...');

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'org.dainst.field',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.MAC_NOTARIZE_AID,
        appleIdPassword: process.env.MAC_NOTARIZE_PW,
        ascProvider: process.env.MAC_NOTARIZE_TID
    });
};
