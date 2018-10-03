import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Query} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {ProjectConfiguration} from 'idai-components-2';
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

    protected query: Query = { limit: 50 };


    constructor(private datastore: IdaiFieldDocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {}


    public isLoading = () => this.loading.isLoading();


    async ngOnChanges() {

        await this.updateResultList();
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.updateResultList();
    }


    public async setQueryTypes(types: string[]) {

        if (types && types.length > 0) {
            this.query.types = types;
        } else {
            delete this.query.types;
        }
        await this.updateResultList();
    }


    public isQuerySpecified(): boolean {

        return ((this.query.q !== undefined && this.query.q.length > 0)
            || (this.query.types !== undefined && this.query.types.length > 0));
    }


    private async updateResultList() {

        this.documents = [];
        if (this.isQuerySpecified()) await this.fetchDocuments();
    }


    private async fetchDocuments() {

        this.loading.start();

        try {
            const result = await this.datastore.find(this.query);
            this.documents = this.filterNotAllowedRelationDomainTypes(result.documents);
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