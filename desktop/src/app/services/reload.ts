const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 *
 *  We have to reload manually since protractor's selectors apparently aren't reliably working as they
 *  should after a reload. So we will do this by hand in the E2Es.
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
