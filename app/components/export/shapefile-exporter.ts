const exec = require('child_process').exec;
const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export module ShapefileExporter {

    export function performExport(filePath: string, projectName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            exec('java -jar ' + getJarPath() + ' ' + getArguments(projectName, filePath),
                (error: string, stdout: string, stderr: string) => {
                    if (error) {
                        reject(error);
                    } else if (stderr !== '') {
                        reject(stderr);
                    } else {
                        resolve();
                    }
                });
        });
    }


    function getJarPath(): string {

        return remote.getGlobal('toolsPath') + '/shapefile-tool.jar';
    }


    function getArguments(projectName: string, outputFilepath: string): string {

        return '\"' + projectName + '\" \"' + outputFilepath + '\" \"'
            + remote.getGlobal('appDataPath') + '/temp\"';
    }
}