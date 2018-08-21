import {Component} from '@angular/core';
import {OBJECTS} from './sample-objects';
import {Datastore} from '../../src/core/datastore/datastore';

@Component({
    selector: 'idai-components-demo-app',
    templateUrl: 'demo/app/app.html'
})
/**
 * @author Daniel de Oliveira
 */
export class AppComponent {

    constructor(private datastore: Datastore) {

        for (let item of OBJECTS) {
            this.datastore.update(item, 'Demo');
        }
    }
}