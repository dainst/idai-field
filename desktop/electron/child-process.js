const electron = require('electron');
const childProcess = require('child_process');


electron.ipcMain.handle('executeChildProcess', async (_, command, jarArguments) => {
    return new Promise((resolve, reject) => {
        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
});
