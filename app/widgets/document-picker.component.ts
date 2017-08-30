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
    protected query: Query = { q: '' };

    constructor(private datastore: Datastore,
                private configLoader: ConfigLoader) {

        this.query = { };
        this.fetchDocuments();
    }

    public setQueryString(q: string) {

        this.query.q = q;
        this.fetchDocuments();
    }

    public setQueryTypes(types: string[]) {

        if (types && types.length > 0) {
            this.query.types = types;
        } else {
            delete this.query.types;
        }

        this.fetchDocuments();
    }

    /**
     * Populates the document list with all documents from the datastore which match the current query.
     */
    public fetchDocuments() {

        this.datastore.find(this.query)
            .then(documents => this.filterDocuments(documents as Array<IdaiFieldDocument>))
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