const electron = require('electron');
const extract = require('extract-zip');
const archiver = require('archiver');
const fs = require('original-fs');


electron.ipcMain.handle('extractZip', async (_, source, destination) => {
    try {
        return { result: await extract(source, { dir: destination }) };
    } catch (error) {
        return { error };
    }
});

electron.ipcMain.handle('createZip', async (_, outputFilePath, directoryPath) => {
    try {
        return { result: await createZip(outputFilePath, directoryPath) };
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


function createZip(outputFilePath, directoryPath) {

    return new Promise((resolve, reject) => {
        const archive = createArchive(outputFilePath, resolve, reject);
        archive.directory(directoryPath, false);
        archive.finalize();
    });
}


function createCatalogZip(outputFilePath, filePath, fileName, imageDirPath, imageDirName) {

    return new Promise((resolve, reject) => {
        const archive = createArchive(outputFilePath, resolve, reject);
        archive.file(filePath, { name: fileName });
        archive.directory(imageDirPath, imageDirName);
        archive.finalize();
    });
}


function createArchive(outputFilePath, resolve, reject) {

    const archive = archiver('zip');
    archive.on('error', err => reject(err));

    const output = fs.createWriteStream(outputFilePath);
    output.on('close', () => resolve());

    archive.pipe(output);

    return archive;
}
