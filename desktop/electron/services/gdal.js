const electron = require('electron');
const fs = require('original-fs');
const log = require('electron-log');
const initGdalJs = require('gdal3.js/node');


const tempDirectoryPath = global.appDataPath + '/gdal';

const exePath = electron.app.getPath('exe');
log.info('exePath', exePath);
log.info('appPath', electron.app.getAppPath());
log.info('appDataPath', global.appDataPath);
log.info('node working directory path', __dirname);
log.info('tempDirectoryPath', tempDirectoryPath);

const gdalPath = getGdalPath();

if (fs.existsSync(tempDirectoryPath)) fs.rmSync(tempDirectoryPath, { recursive: true });
log.info('Create temp directory');
fs.mkdirSync(tempDirectoryPath);

const options = {
    path: gdalPath,
    dest: tempDirectoryPath
};

log.info('Init gdal at path:', options.path);
initGdalJs(options).then(async gdal => {
    log.info('gdal ready!');
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


function getGdalPath() {

    if (global.mode !== 'production') return 'lib/gdal';

    switch (process.platform) {
        case 'darwin':
            return '../../Resources/lib/gdal';
        case 'linux':
            return '../resources/lib/gdal';
        case 'win32':
            return 'resources/lib/gdal';
    }
}
