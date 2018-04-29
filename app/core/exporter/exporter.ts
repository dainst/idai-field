import {Injectable} from '@angular/core';
import {M} from '../../m';
import {PouchdbManager} from '../datastore/core/pouchdb-manager';

const fs = require('electron').remote.require('fs');

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Exporter {

    constructor(private pouchdbManager: PouchdbManager) {}

    public async exportResources(filePath: string): Promise<any> {

        try {
            const result = await this.pouchdbManager.getCompleteChanges();
            fs.writeFileSync(filePath, JSON.stringify(result));
        } catch (_) {
            throw [M.EXPORT_WRITE_ERROR, filePath];
        }
    }
}