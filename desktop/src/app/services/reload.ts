const ipcRenderer = window.require('electron')?.ipcRenderer;
const remote = window.require('@electron/remote');


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export const reload = () => {

    if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
        const route = window.location.href.split('#')[1];
        ipcRenderer.send('reload', route);
    }
};


export const reloadAndSwitchToHomeRoute = () => {

    if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
        ipcRenderer.send('reload', '');
    }
};
