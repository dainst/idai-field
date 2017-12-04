import {Injectable} from '@angular/core';
import {Serializer} from './serializer';
import {Datastore} from 'idai-components-2/datastore';
import {M} from '../../m';

const remote = require('electron').remote;
const fs = remote.require('fs');

@Injectable()
/**
 * @author Thomas Kleinke
 **/
export class Exporter {

    constructor(private datastore: Datastore) {}


    public exportResources(filePath: string, serializer: Serializer): Promise<any> {

        return this.datastore.find({}).then(
            result => {
                fs.writeFile(filePath, serializer.serialize(result.documents), (err: any) => {
                    if (err) {
                        return Promise.reject([M.EXPORT_WRITE_ERROR, filePath]);
                    } else {
                        return Promise.resolve();
                    }
                });
            }, () => Promise.reject([M.ALL_FIND_ERROR])
        );
    }
}