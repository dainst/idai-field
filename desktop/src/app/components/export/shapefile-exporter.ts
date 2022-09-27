import { Document } from 'idai-field-core';
import { JavaToolExecutor } from '../../services/java/java-tool-executor';
import { M } from '../messages/m';
import { Settings } from '../../services/settings/settings';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 */
export module ShapefileExporter {

    export async function performExport(settings: Settings,
                                        projectDocument: Document,
                                        outputFilePath: string,
                                        operationId: string): Promise<any> {

        try {
            await JavaToolExecutor.executeJavaTool(
                'shapefile-tool.jar',
                getArguments(
                    settings.selectedProject, settings.hostPassword,
                    projectDocument, outputFilePath, operationId)
            );
        } catch (err) {
            return Promise.reject(getErrorMsgWithParams(err));
        }
    }


    function getArguments(projectName: string, password: String, projectDocument: Document, outputFilepath: string,
                          operationId: string): string {

        const epsg: string|undefined = getEPSGCode(projectDocument);

        return '"export" '
            + '"' + projectName + '" '
            + '"' + password + '" '
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


    function getErrorMsgWithParams(error: string): string[] {

        if (error.includes('EXPORTER_TEMP_FOLDER_CREATION_ERROR')) {
            return [
                M.EXPORT_SHAPEFILE_ERROR_TEMP_FOLDER_CREATION,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('EXPORTER_ZIP_FILE_WRITE_ERROR')) {
            return [
                M.EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('EXPORTER_SHAPEFILE_WRITE_ERROR')) {
            return [M.EXPORT_SHAPEFILE_ERROR_WRITE];
        } else if (error.includes('DATASTORE_GET_RESOURCES_ERROR')) {
            return [M.EXPORT_SHAPEFILE_ERROR_GET_RESOURCES];
        } else {
            console.error(error);
            return [M.EXPORT_ERROR_GENERIC];
        }
    }
}
