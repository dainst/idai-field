import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Query} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldDocumentDatastore} from '../core/datastore/field/idai-field-document-datastore';
import {Loading} from './loading';

@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DocumentPickerComponent implements OnChanges {

    @Input() relationName: string;
    @Input() relationRangeType: string;

    @Output() documentSelected: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public documents: Array<IdaiFieldDocument>;
    public fetchDocsRunning = false;

    protected query: Query = {};


    constructor(private datastore: IdaiFieldDocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {

        this.query = {};
        this.fetchDocuments();
    }


    async ngOnChanges() {

        await this.fetchDocuments();
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.fetchDocuments();
    }


    public async setQueryTypes(types: string[]) {

        if (types && types.length > 0) {
            this.query.types = types;
        } else {
            delete this.query.types;
        }
        await this.fetchDocuments();
    }


    /**
     * Populates the document list with all documents
     * from the datastore which match the current query.
     */
    private async fetchDocuments() {

        if (this.fetchDocsRunning) return;
        this.fetchDocsRunning = true;

        this.documents = [];
        this.loading.start();

        try {
            const result = await this.datastore.find(this.query);
            this.documents = this.filterNotAllowedRelationDomainTypes(result.documents);
            this.fetchDocsRunning = false;
        } catch (err) {
            console.error(err);
        } finally {
            this.loading.stop();
        }
    }


    private filterNotAllowedRelationDomainTypes(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        const result: Array<IdaiFieldDocument> = [];

        for (let document of documents) {

            if (this.projectConfiguration.isAllowedRelationDomainType(
                    document.resource.type,
                    this.relationRangeType,
                    this.relationName)) {

                result.push(document);
            }
        }

        return result;
    }
}