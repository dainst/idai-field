import { Injectable } from '@angular/core';
import { getAsynchronousFs } from './get-asynchronous-fs';
import { SettingsProvider } from './settings/settings-provider';
import { StateSerializer } from './state-serializer';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


export type StateType = 'app-state'|'resources-state'|'matrix-state'|'tabs-state'|'configuration-state'|'images-state';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StandardStateSerializer extends StateSerializer {

    constructor(protected settingsProvider: SettingsProvider) {

        super();
    }


    public async load(stateType: StateType): Promise<any> {

        try {
            const content: string = await getAsynchronousFs().readFile(this.getFilePath(stateType), 'utf-8');
            return JSON.parse(content);
        } catch (err) {
            return {};
        }
    }


    public async store(stateObject: any, stateType: StateType): Promise<void> {

        if (this.settingsProvider.getSettings().selectedProject === 'test' && stateType !== 'app-state' ) {
            return;
        }

        return getAsynchronousFs().writeFile(this.getFilePath(stateType), JSON.stringify(stateObject));
    }


    public async delete(stateType: StateType): Promise<void> {

        const filePath: string = this.getFilePath(stateType);

        try {
            await getAsynchronousFs().unlink(filePath);
        } catch (_) {
            return;
        }
    }


    protected getFilePath(stateType: StateType): string {

        let filePath: string = remote.getGlobal('appDataPath') + '/' +  stateType;
        if (stateType !== 'app-state') filePath += '-' + this.settingsProvider.getSettings().selectedProject;
        return filePath += '.json';
    }
}
