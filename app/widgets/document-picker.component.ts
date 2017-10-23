import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Datastore, Query} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';

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

    @Output() documentSelected: EventEmitter<IdaiFieldDocument> =
        new EventEmitter<IdaiFieldDocument>();

    public documents: Array<IdaiFieldDocument>;
    protected query: Query = {};


    constructor(private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration) {

        this.query = {};
        this.fetchDocuments();
    }


    ngOnChanges() {

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
     * Populates the document list with all documents
     * from the datastore which match the current query.
     */
    public fetchDocuments() {

        this.datastore.find(this.query)
            .then(
                documents => {
                    this.documents =
                        this.filterNotAllowedRelationDomainTypes(
                            documents as Array<IdaiFieldDocument>)
                },
                err => console.error(err));
    }


    private filterNotAllowedRelationDomainTypes(
            documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

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