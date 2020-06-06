import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../image/grid/image-grid.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ProjectCategoriesUtility} from '../../../core/configuration/project-categories-utility';
import {M} from '../../messages/m';
import {clone} from '../../../core/util/object-util';
import {Messages} from '../../messages/messages';
import {Query} from '../../../core/datastore/model/query';


@Component({
    selector: 'image-picker',
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

    @ViewChild('imageGrid', {static: false}) public imageGrid: ImageGridComponent;

    public documents: Array<ImageDocument>;
    public document: FieldDocument;
    public selectedDocuments: Array<ImageDocument> = [];

    private query: Query = { q: '' };
    private currentQueryId: string;

    private static documentLimit: number = 24;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: ImageReadDatastore,
        private el: ElementRef,
        private projectCategories: ProjectCategoriesUtility
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


    public async setDocument(document: FieldDocument) {

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
    public select(document: ImageDocument) {

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

        this.query.categories = this.projectCategories.getImageCategoryNames();
        this.query.constraints = {
            'depicts:contain': { value: this.document.resource.id, subtract: true }
        };
        this.query.limit = ImagePickerComponent.documentLimit;

        this.currentQueryId = new Date().toISOString();
        this.query.id = this.currentQueryId;

        return this.datastore.find(clone(this.query))
            .then(result => {
                if (result.queryId === this.currentQueryId) this.documents = result.documents;
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
