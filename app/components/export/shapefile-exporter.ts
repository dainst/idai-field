import {Document} from 'idai-components-2';
import {JavaToolExecutor} from '../../common/java-tool-executor';

const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export module ShapefileExporter {

    export function performExport(projectDocument: Document, outputFilePath: string,
                                  operationId: string): Promise<any> {

        return JavaToolExecutor.executeJavaTool(
            'shapefile-tool.jar',
            getArguments(projectDocument, outputFilePath, operationId)
        )
    }


    function getArguments(projectDocument: Document, outputFilepath: string, operationId: string): string {

        const epsg: string|undefined = getEPSGCode(projectDocument);

        return '"export" '
            + '"' + projectDocument.resource.identifier + '" '
            + '"' + outputFilepath + '" '
            + '"' + remote.getGlobal('appDataPath') + '/temp" '
            + '"' + operationId + '"'
            + (epsg ? ' "' + epsg + '"' : '');
    }


    function getEPSGCode(projectDocument: Document): string|undefined {

        const availableEPSGCodes = ['4326', '3857'];

        return availableEPSGCodes.find(epsg => {
            return projectDocument.resource.coordinateReferenceSystem
                && projectDocument.resource.coordinateReferenceSystem.includes(epsg);
        });
    }
}