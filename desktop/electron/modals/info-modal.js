const { ipcRenderer } = require('electron');

document.getElementById('close-button').addEventListener('click', () => {
    ipcRenderer.send('close-info-modal');
});
