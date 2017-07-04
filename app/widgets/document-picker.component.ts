import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Datastore, Query} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader} from 'idai-components-2/configuration';

@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DocumentPickerComponent {

    @Input() relationName: string;
    @Input() relationRangeType: string;

    @Output() documentSelected: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public documents: Array<IdaiFieldDocument>;
    protected query: Query;

    constructor(private datastore: Datastore,
                private configLoader: ConfigLoader) {

        this.query = {q: '', type: 'resource', prefix: true};
        this.fetchDocuments(this.query);
    }

    public queryChanged(query: Query) {

        this.query = query;
        this.fetchDocuments(query);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query) {

        this.datastore.find(query).then(documents => this.filterDocuments(documents as Array<IdaiFieldDocument>))
            .then(filteredDocuments => this.documents = filteredDocuments)
            .catch(err => console.error(err));
    }

    private filterDocuments(documents: Array<IdaiFieldDocument>): Promise<Array<IdaiFieldDocument>> {

        return this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => {

                let result: Array<IdaiFieldDocument> = [];

                for (let document of documents) {

                    if (projectConfiguration.isAllowedRelationDomainType(document.resource.type,
                            this.relationRangeType, this.relationName)) {
                        result.push(document);
                    }
                }

                return Promise.resolve(result);
            }).catch(msgWithParams => Promise.reject(msgWithParams));
    }
    
}