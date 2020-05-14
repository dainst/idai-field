const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;

/**
 * @author Thomas Kleinke
 */
export const reload = () => {

    const route = window.location.href.split('#')[1];
    ipcRenderer.send('reload', route);
};
