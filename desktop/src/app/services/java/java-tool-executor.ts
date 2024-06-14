import { JavaVersionParser } from './java-version-parser';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const ipcRenderer = typeof window !== 'undefined'
  ? window.require('electron').ipcRenderer
  : require('electron').ipcRenderer;


/**
 * @author Thomas Kleinke
 */
export module JavaToolExecutor {

    const REQUIRED_JAVA_VERSION: number = 8;


    export async function executeJavaTool(jarName: string, jarArguments: string) {

        try {
            const result = await ipcRenderer.invoke('executeChildProcess', getCommand(jarName, jarArguments));
            if (result.stderr?.length) {
                console.error(result.stderr);
                throw 'Jar execution failed';
            }
        } catch (err) {
            console.error(err);
            throw 'Jar execution failed';
        }
    }


    export function getParameterFromErrorMessage(error: string): string {

        const separatorPosition: number = error.indexOf(' ');

        if (separatorPosition === -1 || separatorPosition === error.length - 1) {
            return '';
        } else {
            return error.substring(separatorPosition + 1);
        }
    }


    export async function isJavaInstalled(): Promise<boolean> {

        return await getJavaVersion() >= REQUIRED_JAVA_VERSION;
    }


    async function getJavaVersion(): Promise<number> {

        console.log('Available Java installations:', await ipcRenderer.invoke('executeChildProcess', 'whereis java'));
        console.log('Using Java installation at path:', await ipcRenderer.invoke('executeChildProcess', 'which java', 'whereis java'));

        const result = await ipcRenderer.invoke('executeChildProcess', 'java -version');
        return JavaVersionParser.parse(result.stderr);
    }


    function getCommand(jarName: string, jarArguments: string): string {

        return 'java -Djava.awt.headless=true -jar "' + getJarPath(jarName) + '" ' + jarArguments;
    }


    function getJarPath(jarName: string): string {

        return remote.getGlobal('toolsPath') + '/' + jarName;
    }
}
