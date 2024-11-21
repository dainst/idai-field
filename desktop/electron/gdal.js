const electron = require('electron');
const path = require('path');
const fs = require('original-fs');
const initGdalJs = require('gdal3.js/node');


const tempDirectoryPath = path.relative(electron.app.getAppPath(), global.appDataPath + '/gdal');
if (fs.existsSync(tempDirectoryPath)) fs.rmSync(tempDirectoryPath, { recursive: true });
fs.mkdirSync(tempDirectoryPath);

initGdalJs({ dest: tempDirectoryPath }).then(async gdal => {
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
});
