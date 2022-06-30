const { ipcRenderer } = require('electron');

document.getElementById('ok-button').addEventListener('click', () => {
    ipcRenderer.send('close-download-finished-modal');
});
