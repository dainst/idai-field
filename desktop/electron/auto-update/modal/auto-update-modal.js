const { ipcRenderer } = require('electron');

document.getElementById('yes-button').addEventListener('click', () => {
    ipcRenderer.send('confirm-auto-update');
});

document.getElementById('no-button').addEventListener('click', () => {
    ipcRenderer.send('decline-auto-update');
});
