import { AppState } from '../../services/app-state';


/**
 * This "interface" exists for the sole reason that the unit test should not see
 * the require from the concrete-dialog-provider which is to be resolved only in context with electron.
 * The import from the backup component goes simply to this file here.
 *
 * @author Daniel de Oliveira
 */
export class DialogProvider {

    public chooseFilepath(_: string, __?: AppState): Promise<string> {

        return Promise.resolve('');
    }
}
