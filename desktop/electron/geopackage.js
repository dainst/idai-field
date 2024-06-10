const electron = require('electron');
const { GeoPackageAPI, setCanvasKitWasmLocateFile } = require('@ngageoint/geopackage');


electron.ipcMain.handle('readGeopackage', async (_, path) => {
   
    try {
        const result = await readGeopackage(path);
        return { result };
    } catch (err) {
        return { error: err };
    }
});


async function readGeopackage(filePath) {

    console.log('Reading geopackage file:', filePath);

    setCanvasKitWasmLocateFile(fileName => {
        console.log('Path to canvas kit wasm file:', global.toolsPath + '/' + fileName);
        return global.toolsPath + '/' + fileName
    });

    const geoPackage = await GeoPackageAPI.open(filePath);
    const featureTablesNames = geoPackage.getFeatureTables();
    if (featureTablesNames.length === 0) throw 'No feature table found in GeoPackage';

    const featureTableName = featureTablesNames[0];
    const featureDao = geoPackage.getFeatureDao(featureTableName);

    return geoPackage.getInfoForTable(featureDao);
}
