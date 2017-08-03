import {Injectable} from '@angular/core';
import {Serializer} from './serializer';
import {Datastore} from 'idai-components-2/datastore';
import {M} from '../m';

const remote = require('electron').remote;
const fs = remote.require('fs');

@Injectable()
/**
 * @author Thomas Kleinke
 **/
export class Exporter {

    constructor(private datastore: Datastore) {}

    public exportResources(filePath: string, serializer: Serializer): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.find({}).then(
                documents => {
                    fs.writeFile(filePath, serializer.serialize(documents), (err) => {
                        if (err) {
                            reject([M.EXPORT_WRITE_ERROR, filePath]);
                        } else {
                            resolve();
                        }
                    });
                }, msgWithParams => reject(msgWithParams)
            );
        });
    }
}