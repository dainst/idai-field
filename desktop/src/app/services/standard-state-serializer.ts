import { Injectable } from '@angular/core';
import { SettingsProvider } from './settings/settings-provider';
import { StateSerializer } from './state-serializer';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fs = typeof window !== 'undefined' ? window.require('fs').promises : require('fs').promises;


export type StateType = 'resources-state'|'matrix-state'|'tabs-state'|'configuration-state';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StandardStateSerializer extends StateSerializer {

    constructor(private settingsProvider: SettingsProvider) {

        super();
    }


    public async load(stateType: StateType): Promise<any> {

        try {
            const content: string = await fs.readFile(this.getFilePath(stateType), 'utf-8');
            return JSON.parse(content);
        } catch (err) {
            return {};
        }
    }


    public async store(stateObject: any, stateType: StateType): Promise<void> {

        if (this.settingsProvider.getSettings().selectedProject === 'test') return;

        return fs.writeFile(this.getFilePath(stateType), JSON.stringify(stateObject));
    }


    public async delete(stateType: StateType): Promise<void> {

        const filePath: string = this.getFilePath(stateType);

        try {
            await fs.unlink(filePath);
        } catch (_) {
            return;
        }
    }


    private getFilePath(stateType: StateType): string {

        return remote.getGlobal('appDataPath') + '/' +  stateType + '-'
            + this.settingsProvider.getSettings().selectedProject + '.json';
    }
}
