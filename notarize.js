const {notarize} = require('electron-notarize');


exports.default = async function performNotarization(context) {

    return; // comment out to enable notarization
    
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') return;

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'org.dainst.field',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.NOTARIZATION_AID,
        appleIdPassword: process.env.NOTARIZATION_PWD,
        ascProvider: process.env.NOTARIZATION_TID
    });
};
