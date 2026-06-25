import { electronIpc as ipcRenderer } from 'src/app/electron/electron';
import { electronRemote as remote } from 'src/app/electron/electron';


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
