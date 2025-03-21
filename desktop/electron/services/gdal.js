const electron = require('electron');
const fs = require('original-fs');
const log = require('electron-log');
const initGdalJs = require('gdal3.js/node');


const tempDirectoryPath = global.appDataPath + '/gdal';

if (fs.existsSync(tempDirectoryPath)) fs.rmSync(tempDirectoryPath, { recursive: true });

try {
    fs.mkdirSync(tempDirectoryPath);
} catch (err) {
    console.error('Error while trying to create temp directory for gdal', err);
}

const options = {
    path: 'lib/gdal',
    dest: tempDirectoryPath
};

initGdalJs(options).then(async gdal => {
    electron.ipcMain.handle('ogr2ogr', async (_, sourceFilePath, options, outputFileBaseName) => {
        try {
            const result = await gdal.open(sourceFilePath);
            const file = result.datasets[0];
            await gdal.ogr2ogr(file, options, outputFileBaseName);
            await gdal.close(file);
            return { success: true };
        } catch (error) {
            return { error };
        }
    });
}).catch(err => log.error(err));
