import { AppState } from '../../services/app-state';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';
import { M } from '../messages/m';

const remote = window.require('@electron/remote');


/**
 * @author Thomas Kleinke
 */
export async function exportGraph(content: string, projectName: string, trenchIdentifier: string, appState: AppState,
                                  fileFilterLabel: string) {

    const filePath: string = await chooseFilepath(projectName, trenchIdentifier, appState, fileFilterLabel);
    if (!filePath) throw 'canceled';

    await writeFile(filePath, content);
}


async function chooseFilepath(projectName: string, trenchIdentifier: string, appState: AppState,
                              fileFilterLabel: string): Promise<string> {

    const defaultPath: string = getDefaultPath(projectName, trenchIdentifier, appState);

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(
        {
            defaultPath,
            filters: [
                { name: fileFilterLabel, extensions: [ 'gv' ] }
            ]
        }
    );

    const filePath: string = saveDialogReturnValue.filePath;
    
    if (filePath) {
        appState.setFolderPath(filePath, 'matrixExport');
        return filePath;
    } else {
        return undefined;
    }
}


function getDefaultPath(projectName: string, trenchIdentifier: string, appState?: AppState): string {

    const folderPath: string = appState?.getFolderPath('matrixExport');
    const fileName: string = projectName + '_' + trenchIdentifier + '.gv';

    return folderPath
        ? folderPath + '/' + fileName
        : fileName;
}


async function writeFile(outputFilePath: string, content: any): Promise<void> {
        
    try {
        return await getAsynchronousFs().writeFile(outputFilePath, content);
    } catch (err) {
        console.error('Error while trying to write file: ' + outputFilePath, err);
        throw [M.EXPORT_ERROR_GENERIC];
    }
}
