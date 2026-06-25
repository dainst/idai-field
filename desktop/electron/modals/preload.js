const { ipcRenderer } = require('electron');

const normalizeText = value => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map(normalizeText).join('\n\n');
    if (typeof value === 'object') return normalizeText(value.note || value.version || JSON.stringify(value));
    return String(value);
};

const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = normalizeText(value);
};

const setBorder = withBorder => {
    if (!withBorder) return;

    const container = document.getElementById('modal-container');
    if (container) container.classList.add('with-border');
};

const setReleaseNotes = ({ version, releaseNotes }) => {
    const element = document.getElementById('release-notes');
    if (!element) return;

    element.textContent = '';

    const heading = document.createElement('h2');
    heading.textContent = `Field Desktop ${normalizeText(version)}`;
    element.appendChild(heading);

    const notes = document.createElement('div');
    notes.textContent = normalizeText(releaseNotes);
    element.appendChild(notes);
};

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('yes-button')?.addEventListener('click', () => {
        ipcRenderer.send('confirm-auto-update');
    });

    document.getElementById('no-button')?.addEventListener('click', () => {
        ipcRenderer.send('decline-auto-update');
    });

    document.getElementById('ok-button')?.addEventListener('click', () => {
        ipcRenderer.send('close-download-finished-modal');
    });

    document.getElementById('close-button')?.addEventListener('click', () => {
        ipcRenderer.send('close-info-modal');
    });
});

ipcRenderer.on('auto-update-available-data', (_event, data) => {
    setText('heading', data.heading);
    setReleaseNotes(data);
    setText('yes-button', data.yesButton);
    setText('no-button', data.noButton);
    setText('update-warning', data.warning);
    setText('info-message', data.question);
    setBorder(data.withBorder);
});

ipcRenderer.on('download-finished-data', (_event, data) => {
    setText('heading', data.heading);
    setText('info-message', data.infoMessage);
    setText('ok-button', data.okButton);
    setBorder(data.withBorder);
});

ipcRenderer.on('info-data', (_event, data) => {
    setText('about-version', data.version);
    setText('close-button', data.closeButton);
    setBorder(data.withBorder);
});
