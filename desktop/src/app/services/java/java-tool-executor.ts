import { JavaVersionParser } from './java-version-parser';

const exec = globalThis.require('child_process').exec;
const remote = globalThis.require('@electron/remote');


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
                        resolve(undefined);
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

        return await getJavaVersion() >= REQUIRED_JAVA_VERSION;
    }


    function getJavaVersion(): Promise<number> {

        exec('whereis java', (error: string, stdout: string, stderr: string) => {
            console.log('Available java installations:', stdout);
        });

        exec('which java', (error: string, stdout: string, stderr: string) => {
            console.log('Using Java installation at path:', stdout);
        });

        return new Promise(resolve => {
            exec('java -version', (error: string, stdout: string, stderr: string) => {
                resolve(JavaVersionParser.parse(stderr));
            });
        });
    }


    function getCommand(jarName: string, jarArguments: string): string {

        return 'java -Djava.awt.headless=true -jar "' + getJarPath(jarName) + '" ' + jarArguments;
    }


    function getJarPath(jarName: string): string {

        return remote.getGlobal('toolsPath') + '/' + jarName;
    }
}
