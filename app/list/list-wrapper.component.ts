import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';

@Component({
    moduleId: module.id,
    templateUrl: './list-wrapper.html'
})

export class ListWrapperComponent {

    public documents: IdaiFieldDocument[];

    protected query: Query = {q: '', type: 'resource', prefix: true};

    constructor(
        private messages: Messages,
        private datastore: IdaiFieldDatastore,
        configLoader: ConfigLoader
    ) {
        this.fetchDocuments();
    }

    public fetchDocuments(query: Query = this.query) {
        this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldDocument[];

        }).catch(err => { console.error(err); } );
    }


    public queryChanged(query: Query) {
        this.query = query;
        this.fetchDocuments(query);
    }
}