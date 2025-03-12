const electron = require('electron');
const fs = require('original-fs');
const log = require('electron-log');
const initGdalJs = require('gdal3.js/node');


const tempDirectoryPath = global.appDataPath + '/gdal';

if (fs.existsSync(tempDirectoryPath)) fs.rmSync(tempDirectoryPath, { recursive: true });
fs.mkdirSync(tempDirectoryPath);

const options = {
    path: 'lib/gdal',
    dest: tempDirectoryPath
};

initGdalJs(options).then(async gdal => {
    electron.ipcMain.handle('ogr2ogr', async (_, sourceFilePath, options, outputFileBaseName) => {
        try {
            const result = await gdal.open(sourceFilePath);
            const file = result.datasets[0];

            // TODO Move to its own function
            log.info(await gdal.getInfo(file));
            await gdal.ogr2ogr(file, options, outputFileBaseName);
            await gdal.close(file);
            return { success: true };
        } catch (error) {
            return { error };
        }
    });
}).catch(err => log.error(err));
