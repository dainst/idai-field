import {Document} from 'idai-components-2';

const exec = require('child_process').exec;
const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export module ShapefileExporter {

    export function performExport(filePath: string, projectDocument: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            exec('java -jar ' + getJarPath() + ' ' + getArguments(projectDocument, filePath),
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


    function getArguments(projectDocument: Document, outputFilepath: string): string {

        const epsg: string|undefined = getEPSGCode(projectDocument);

        return '\"' + projectDocument.resource.identifier + '\" '
            + '\"' + outputFilepath + '\" '
            + '\"' + remote.getGlobal('appDataPath') + '/temp\" '
            + (epsg ? '\"' + epsg + '\"' : '');
    }


    function getEPSGCode(projectDocument: Document): string|undefined {

        const availableEPSGCodes = ['4326', '3857'];

        return availableEPSGCodes.find(epsg => {
            return projectDocument.resource.coordinateReferenceSystem
                && projectDocument.resource.coordinateReferenceSystem.includes(epsg);
        });
    }
}