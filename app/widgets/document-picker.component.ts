import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Datastore, Query, FilterSet} from "idai-components-2/datastore";
import {IdaiFieldDocument} from "../model/idai-field-document";

@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})
export class DocumentPickerComponent {

    @Input() filterSet: FilterSet;
    @Output() documentSelected: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public documents: IdaiFieldDocument[];
    protected query: Query;

    constructor(private datastore: Datastore) {
        this.query = {q: '', filterSets: [this.filterSet]};
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

        this.datastore.find(query).then(documents => {
            console.log("find",documents)
            this.documents = documents as IdaiFieldDocument[];
        }).catch(err => console.error(err));
    }
    
}