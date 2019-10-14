exports.default = async function notarize(context) {

    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') return;

    const appName = context.packager.appInfo.productFilename;

    return await require('electron-notarize')({
        appBundleId: 'org.dainst.field',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.NOTARIZATION_AID,
        appleIdPassword: process.env.NOTARIZATION_PWD,
    });
};