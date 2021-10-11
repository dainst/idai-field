import {Injectable} from '@angular/core';
import {ChangesStream} from 'idai-field-core';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class ImageChangesStream {

    constructor(changesStream: ChangesStream) {

        changesStream.remoteChangesNotifications().subscribe(next => {
            console.log('next', next);
        });
    }
}
