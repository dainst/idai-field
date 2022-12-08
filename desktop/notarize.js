const {notarize} = require('electron-notarize');


exports.default = async function performNotarization(context) {

    if (process.env.MAC_NOTARIZE !== 'true') return;

    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') return;

    const appName = context.packager.appInfo.productFilename;

    console.log(`Performing notarization for ${appName} ...`);

    return await notarize({
        appBundleId: 'org.dainst.field',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.MAC_NOTARIZE_AID,
        appleIdPassword: process.env.MAC_NOTARIZE_PW,
        ascProvider: process.env.MAC_NOTARIZE_TID
    });
};
