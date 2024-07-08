const ipcRenderer = globalThis.require('electron')?.ipcRenderer;
const remote = globalThis.require('@electron/remote');


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export const reload = () => {

    if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
        const route = globalThis.location.href.split('#')[1];
        ipcRenderer.send('reload', route);
    }
};


export const reloadAndSwitchToHomeRoute = () => {

    if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
        ipcRenderer.send('reload', '');
    }
};
