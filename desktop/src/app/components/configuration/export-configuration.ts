import { ConfigurationDocument } from 'idai-field-core';
import { getAsynchronousFs } from '../../services/getAsynchronousFs';
import { M } from '../messages/m';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 */
export async function exportConfiguration(configurationDocument: ConfigurationDocument, projectName: string,
                                          getTranslation: (id: string) => string) {

    const filePath: string = await chooseFilepath(projectName, getTranslation);
    if (!filePath) return;

    const content: string = getContent(configurationDocument);

    await writeFile(filePath, content);
}


async function chooseFilepath(projectName: string, getTranslation: (id: string) => string): Promise<string> {

    const options = {
        filters: [
            {
                name: getTranslation('configurationFile'),
                extensions: ['configuration']
            }
        ],
        defaultPath: projectName + '.configuration'
    };

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(options);

    return saveDialogReturnValue.filePath;
}


function getContent(configurationDocument: ConfigurationDocument): string {

    const serializationObject = {
        forms: configurationDocument.resource.forms,
        languages: configurationDocument.resource.languages,
        order: configurationDocument.resource.order,
        valuelists: configurationDocument.resource.valuelists,
        projectLanguages: configurationDocument.resource.projectLanguages,
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
