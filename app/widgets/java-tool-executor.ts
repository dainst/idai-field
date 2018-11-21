const exec = require('child_process').exec;
const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export module JavaToolExecutor {

    const REQUIRED_JAVA_VERSION: number = 8;


    export function executeJavaTool(jarName: string, jarArguments: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            exec(getCommand(jarName, jarArguments),
                (error: string, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(error);
                        reject('Jar execution failed');
                    } else if (stderr !== '') {
                        reject(stderr);
                    } else {
                        resolve();
                    }
                });
        });
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

        const javaVersion = await getJavaVersion();

        return javaVersion !== undefined
            && parseInt(javaVersion.split('.')[1]) >= REQUIRED_JAVA_VERSION;
    }


    function getJavaVersion(): Promise<string> {

        return new Promise(resolve => {
            exec('java -version', (error: string, stdout: string, stderr: string) => {
                const javaVersion = new RegExp('java version').test(stderr)
                    ? stderr.split(' ')[2].replace(/"/g, '')
                    : undefined;
                resolve(javaVersion);
            });
        });
    }


    function getCommand(jarName: string, jarArguments: string): string {

        return 'java -Djava.awt.headless=true -jar ' + getJarPath(jarName) + ' ' + jarArguments;
    }


    function getJarPath(jarName: string): string {

        return remote.getGlobal('toolsPath') + '/' + jarName;
    }
}