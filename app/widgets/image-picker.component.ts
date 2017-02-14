import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {BlobProxy} from "../common/blob-proxy";
import {Messages} from "idai-components-2/messages";
import {Mediastore, FilterSet, Query, Datastore} from "idai-components-2/datastore";
import {DomSanitizer} from "@angular/platform-browser";
import {ConfigLoader} from "idai-components-2/configuration";
import {FilterUtility} from "../util/filter-utility";
import {ElementRef} from "@angular/core";

@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html'
})
export class ImagePickerComponent {

    selected: IdaiFieldImageDocument[] = [];
    private imageGridBuilder : ImageGridBuilder;
    private defaultFilterSet: FilterSet;
    private query : Query = { q: '' };
    private rows = [];
    private documents: IdaiFieldImageDocument[];
    private nrOfColumns = 3;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        mediastore: Mediastore,
        private datastore: Datastore,
        sanitizer: DomSanitizer,
        configLoader: ConfigLoader,
        private el: ElementRef
    ) {
        this.imageGridBuilder = new ImageGridBuilder(new BlobProxy(mediastore, sanitizer), true);

        var defaultFilterSet = {
            filters: [{field: 'type', value: 'image', invert: false}],
            type: 'or'
        };
        
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            if (!this.defaultFilterSet) {
                this.defaultFilterSet =
                    FilterUtility.addChildTypesToFilterSet(defaultFilterSet, projectConfiguration.getTypesMap());
                this.query = {q: '', filterSets: [this.defaultFilterSet]};
                this.fetchDocuments(this.query);
            }
        });
    }

    public queryChanged(query: Query) {
        this.query = query;
        this.fetchDocuments(query);
    }

    public onResize() {
        this.calcGrid();
    }

    private calcGrid() {
        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.documents,this.nrOfColumns, this.el.nativeElement.children[0].clientWidth).then(result=>{
            this.rows = result['rows'];
            for (var msgWithParams of result['msgsWithParams']) {
                this.messages.addWithParams(msgWithParams);
            }
        });
    }

    /**
     * @param documentToSelect the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {
        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {
        this.query = query;

        this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldImageDocument[];

            this.calcGrid();

        }).catch(err => console.error(err));
    }

}