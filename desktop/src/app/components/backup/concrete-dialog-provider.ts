import { AppState } from '../../services/app-state';

const remote = globalThis.require('@electron/remote');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConcreteDialogProvider {

    public async chooseFilepath(projectName: string, appState?: AppState): Promise<string> {

        const defaultPath: string = this.getDefaultPath(projectName, appState);

        const saveDialogReturnValue = await remote.dialog.showSaveDialog(
            {
                defaultPath,
                filters: [
                    { name: 'JSON Lines', extensions: [ 'jsonl' ] }
                ]
            }
        );

        const filePath: string = saveDialogReturnValue.filePath;
        
        if (filePath) {
            if (appState) appState.setFolderPath(filePath, 'backupCreation');
            return filePath;
        } else {
            return undefined;
        }
    }


    private getDefaultPath(projectName: string, appState?: AppState): string {

        const folderPath: string = appState?.getFolderPath('backupCreation');
        const fileName: string = projectName + '.jsonl';

        return folderPath
            ? folderPath + '/' + fileName
            : fileName;
    }
}
