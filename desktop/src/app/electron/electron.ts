type IpcListener = (event: any, ...args: Array<any>) => void;

const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
const requireFallback = typeof window !== 'undefined' ? (window as any).require : undefined;
const safeRequire = (moduleName: string) => {
    if (!requireFallback) return undefined;
    try {
        return requireFallback(moduleName);
    } catch (_) {
        return undefined;
    }
};
const electronFallback = safeRequire('electron');
const remoteFallback = electronFallback?.remote;

export const electronApp = api?.app ?? remoteFallback?.app;
export const electronDialog = api?.dialog ?? remoteFallback?.dialog;
export const electronFilesystem = api?.filesystem ?? (typeof window !== 'undefined' ? (window as any).filesystem : undefined);
export const electronFs = api?.fs ?? safeRequire('fs');
export const electronGlobals = api?.globals;
export const electronIpc = api?.ipcRenderer ?? electronFallback?.ipcRenderer;
export const electronOs = api?.os ?? safeRequire('os');
export const electronPath = api?.path ?? safeRequire('path');
export const electronRemote = api?.remote ?? remoteFallback;
export const electronWebUtils = api?.webUtils ?? electronFallback?.webUtils;

export const onIpc = (channel: string, listener: IpcListener): (() => void) | undefined => {
    return electronIpc?.on(channel, listener);
};
