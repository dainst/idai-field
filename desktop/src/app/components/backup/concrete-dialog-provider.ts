const { dialog } = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

/**
 * @author Daniel de Oliveira
 */
export class ConcreteDialogProvider {

    public async chooseFilepath(): Promise<string> {

        const saveDialogReturnValue = await dialog.showSaveDialog(
            {
                filters: [
                    { name: 'JSON Lines', extensions: [ 'jsonl' ] }
                ]
            }
        );

        return saveDialogReturnValue.filePath;
    }
}
