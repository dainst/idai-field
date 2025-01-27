const electron = require('electron');
const fs = require('original-fs');


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
