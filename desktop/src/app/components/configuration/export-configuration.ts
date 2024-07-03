import { ConfigurationDocument } from 'idai-field-core';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';
import { AppState } from '../../services/app-state';
import { M } from '../messages/m';

const remote = window.require('@electron/remote');


/**
 * @author Thomas Kleinke
 */
export async function exportConfiguration(configurationDocument: ConfigurationDocument, projectName: string,
                                          appState: AppState, getTranslation: (id: string) => string) {

    const filePath: string = await chooseFilepath(projectName, appState, getTranslation);
    if (!filePath) throw 'canceled';

    const content: string = getContent(configurationDocument);

    await writeFile(filePath, content);
}


async function chooseFilepath(projectName: string, appState: AppState,
                              getTranslation: (id: string) => string): Promise<string> {

    const options = {
        filters: [
            {
                name: getTranslation('configurationFile'),
                extensions: ['configuration']
            }
        ],
        defaultPath: getDefaultPath(appState.getFolderPath('configurationExport'), projectName)
    };

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(options);
    const filePath: string = saveDialogReturnValue.filePath;

    if (filePath) {
        appState.setFolderPath(filePath, 'configurationExport');
        return filePath;
    } else {
        return undefined;
    }
}


function getDefaultPath(defaultFolderPath: string, projectName: string): string {

    const fileName: string = projectName + '.configuration';

    return defaultFolderPath
        ? defaultFolderPath + '/' + fileName
        : fileName;
}


function getContent(configurationDocument: ConfigurationDocument): string {

    const serializationObject = {
        version: remote.app.getVersion(),
        forms: configurationDocument.resource.forms,
        languages: configurationDocument.resource.languages,
        order: configurationDocument.resource.order,
        valuelists: configurationDocument.resource.valuelists,
        projectLanguages: configurationDocument.resource.projectLanguages
    };

    return Buffer.from(JSON.stringify(serializationObject)).toString('base64');
}


async function writeFile(outputFilePath: string, content: string): Promise<void> {
        
    try {
        return await getAsynchronousFs().writeFile(outputFilePath, content);
    } catch (err) {
        console.error('Error while trying to write file: ' + outputFilePath, err);
        throw [M.EXPORT_ERROR_GENERIC];
    }
}
