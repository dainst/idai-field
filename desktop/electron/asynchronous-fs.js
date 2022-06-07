const electron = require('electron');
const fs = require('original-fs');
const extract = require('extract-zip');
const archiver = require('archiver');

electron.ipcMain.handle('getFileInfos', async (_, paths) => {
    try {
        const fileInfos = await Promise.all(paths.map(async (path) => {
            const stat = await fs.promises.stat(path);
            return {
                size: stat.size,
                isDirectory: stat.isDirectory()
            };
        }));
        return { result: fileInfos };
    } catch (error) {
        return { result: error };
    }
});

electron.ipcMain.handle('isFile', async (_, path) => {
    try {
        return { result: (await fs.promises.stat(path)).isFile() };
    } catch (error) {
        return { result: false };
    }
});

electron.ipcMain.handle('isDirectory', async (_, path) => {
    try {
        return { result: (await fs.promises.stat(path)).isDirectory() };
    } catch (error) {
        return { result: false };
    }
});

electron.ipcMain.handle('writeFile', async (_, path, contents) => {
    try {
        return { result: await fs.promises.writeFile(path, contents) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('readFile', async (_, path, encoding) => {
    try {
        return { result: await fs.promises.readFile(path, encoding) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('readdir', async (_, path) => {
    try {
        return { result: await fs.promises.readdir(path) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('mkdir', async (_, path, options) => {
    try {
        return { result: await fs.promises.mkdir(path, options) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('rm', async (_, path, options) => {
    try {
        return { result: await fs.promises.rm(path, options) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('unlink', async (_, path) => {
    try {
        return { result: await fs.promises.unlink(path) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('extractZip', async (_, source, destination) => {
    try {
        return { result: await extract(source, { dir: destination }) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('createCatalogZip', async (_, outputFilePath, filePath, fileName,
    imageDirPath, imageDirName) => {
    try {
        return { result: await createCatalogZip(outputFilePath, filePath, fileName, imageDirPath, imageDirName) };
    } catch (error) {
        return { error };
    }
});


function createCatalogZip(outputFilePath, filePath, fileName, imageDirPath, imageDirName) {

    return new Promise((resolve, reject) => {
        const archive = archiver('zip');
        archive.on('error', err => reject(err));

        const output = fs.createWriteStream(outputFilePath);
        output.on('close', () => resolve());

        archive.pipe(output);
        archive.file(filePath, { name: fileName });
        archive.directory(imageDirPath, imageDirName);
        archive.finalize();
    });
}
