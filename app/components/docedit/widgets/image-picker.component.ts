import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, Query, IdaiFieldDocument, IdaiFieldImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {ImageDocumentReadDatastore} from '../../../core/datastore/field/image-document-read-datastore';
import {TypeUtility} from '../../../core/model/type-utility';
import {M} from '../../m';
import {clone} from '../../../core/util/object-util';


@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ImagePickerComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public documents: Array<IdaiFieldImageDocument>;
    public document: IdaiFieldDocument;
    public selectedDocuments: Array<IdaiFieldImageDocument> = [];

    private query: Query = { q: '' };
    private currentQueryId: string;

    private static documentLimit: number = 24;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: ImageDocumentReadDatastore,
        private el: ElementRef,
        private typeUtility: TypeUtility
    ) {}


    public ngOnInit() {

        // Listen for transformation of modal to capture finished 
        // resizing and invoke recalculation of imageGrid
        let modalEl = this.el.nativeElement.parentElement.parentElement;
        modalEl.addEventListener('transitionend', (event: any) => {
            if (event.propertyName === 'transform') this.onResize();
        });
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.activeModal.dismiss('cancel');
        } else if (event.key === 'Enter') {
            this.applySelection();
        }
    }


    public async setDocument(document: IdaiFieldDocument) {

        this.document = document;
        await this.fetchDocuments(this.query);
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.fetchDocuments(this.query);
    }


    public onResize() {

        this.imageGrid.calcGrid();
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (!this.selectedDocuments.includes(document)) {
            this.selectedDocuments.push(document);
        } else {
            this.selectedDocuments.splice(this.selectedDocuments.indexOf(document), 1);
        }
    }


    public applySelection() {

        if (this.selectedDocuments.length > 0) this.activeModal.close(this.selectedDocuments);
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query;
        if (!this.query) this.query = {};

        this.query.types = this.typeUtility.getImageTypeNames();
        this.query.constraints = {
            'depicts:contain': { value: this.document.resource.id, type: 'subtract' }
        };
        this.query.limit = ImagePickerComponent.documentLimit;

        this.currentQueryId = new Date().toISOString();
        this.query.id = this.currentQueryId;

        return this.datastore.find(clone(this.query))
            .then(result => {
                if (result.queryId === this.currentQueryId) this.documents = result.documents
            })
            .catch(errWithParams => {
                console.error('Error in find with query', this.query);
                if (errWithParams.length === 2) {
                    console.error('Error in find', errWithParams[1]);
                }
                this.messages.add([M.ALL_ERROR_FIND]);
            });
    }
}