import { AppState } from '../../services/app-state';

const { dialog } = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Daniel de Oliveira
 */
export class ConcreteDialogProvider {

    public async chooseFilepath(appState?: AppState): Promise<string> {

        const defaultPath: string = appState?.getFolderPath('backupCreation');

        const saveDialogReturnValue = await dialog.showSaveDialog(
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
}
