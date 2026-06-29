import { Injectable } from '@angular/core';
import { IndexFacade, PouchdbDatastore, WarningsManager } from 'idai-field-core';
import { SettingsProvider } from './settings/settings-provider';

const remote = window.require('@electron/remote');
const fs = window.require('fs');
const zlib = window.require('zlib');


export interface SerializationObject {
    version: string;
    updateSequence: number;
    data: any;
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class SerializationService {

    constructor(private indexFacade: IndexFacade,
                private warningsManager: WarningsManager,
                private pouchdbDatastore: PouchdbDatastore,
                private settingsProvider: SettingsProvider) {}


    public async serialize() {

        if (remote.getGlobal('mode') === 'test') return;

        const updateSequence: number = await this.getUpdateSequence();

        this.writeFile('fulltextIndex', this.indexFacade.getFulltextIndex(), updateSequence);
        this.writeFile('constraintIndex', this.indexFacade.getConstraintIndex(), updateSequence);
        this.writeFile('indexItems', this.indexFacade.getIndexItems(), updateSequence);
        this.writeFile('warnings', this.warningsManager.getAll(), updateSequence);
        this.writeFile('info', true, updateSequence);
    }


    private writeFile(fileName: string, data: any, updateSequence: number) {

        const targetDirectoryPath: string = this.getTargetDirectoryPath();

        if (!fs.existsSync(targetDirectoryPath)) fs.mkdirSync(targetDirectoryPath, { recursive: true });

        const serializationObject: SerializationObject = {
            version: remote.app.getVersion(),
            updateSequence,
            data
        };

        const filePath: string = targetDirectoryPath + '/' + fileName + '.field';

        const brotliOptions = {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
        };

        fs.writeFileSync(filePath,  zlib.brotliCompressSync(JSON.stringify(serializationObject), brotliOptions));
    }


    private async getUpdateSequence(): Promise<number> {

        return (await this.pouchdbDatastore.getDb().info()).update_seq;
    }


    private getTargetDirectoryPath(): string {

        return remote.getGlobal('appDataPath') + '/index/' + this.settingsProvider.getSettings().selectedProject;
    }
}
