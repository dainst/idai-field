const {dialog} = require('electron').remote;

/**
 * @author Daniel de Oliveira
 */
export class ConcreteDialogProvider {

    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const filePath = await dialog.showSaveDialog(
                { filters: [ { name: 'JSON Lines', extensions: [ 'jsonl' ] } ] });
            resolve(filePath);
        });
    }
}