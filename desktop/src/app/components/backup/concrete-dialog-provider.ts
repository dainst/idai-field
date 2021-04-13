const {dialog} = typeof window !== 'undefined' ? window.require('@electron/remote') : require('@electron/remote');

/**
 * @author Daniel de Oliveira
 */
export class ConcreteDialogProvider {

    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const saveDialogReturnValue = await dialog.showSaveDialog(
                { filters: [ { name: 'JSON Lines', extensions: [ 'jsonl' ] } ] });
            resolve(saveDialogReturnValue.filePath);
        });
    }
}
