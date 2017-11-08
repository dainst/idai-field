import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2/messages';
import {Query} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {ImageTypeUtility} from '../../../common/image-type-utility';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {M} from '../../../m';
import {IdaiFieldImageDocumentReadDatastore} from "../../../core/datastore/idai-field-image-document-read-datastore";


@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ImagePickerComponent implements OnInit {


    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: IdaiFieldImageDocument[];

    public document: IdaiFieldDocument;
    public selectedDocuments: Array<IdaiFieldImageDocument> = [];

    private query: Query = { q: '' };


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private el: ElementRef,
        private imageTypeUtility: ImageTypeUtility
    ) {
        this.fetchDocuments(this.query);
    }


    public ngOnInit() {

        // Listen for transformation of modal to capture finished 
        // resizing and invoke recalculation of imageGrid
        let modalEl = this.el.nativeElement.parentElement.parentElement;
        modalEl.addEventListener('transitionend', (event: any) => {
            if (event.propertyName == 'transform') this.onResize();
        });
    }


    public setDocument(document: IdaiFieldDocument) {

        this.document = document;
    }


    public setQueryString(q: string) {

        this.query.q = q;
        this.fetchDocuments(this.query);
    }


    public onResize() {

        this.imageGrid.calcGrid();
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selectedDocuments.indexOf(document) == -1) this.selectedDocuments.push(document);
        else this.selectedDocuments.splice(this.selectedDocuments.indexOf(document), 1);
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query;
        if (!this.query) this.query = {};

        this.query.types = this.imageTypeUtility.getProjectImageTypeNames();

        return this.datastore.find(this.query)
            // .catch(msgWithParams => this.messages.add(msgWithParams)
            .then(documents => {
                this.documents = this.filterOutAlreadyLinkedImageDocuments(documents);
            })
            .catch(errWithParams => {
                console.error('error in find with query', this.query);
                if (errWithParams.length == 2) {
                    console.error('error in find, cause', errWithParams[1]);
                }
                this.messages.add([M.ALL_FIND_ERROR]);
            });
    }


    private filterOutAlreadyLinkedImageDocuments(imageDocuments: IdaiFieldImageDocument[])
            : IdaiFieldImageDocument[] {

        let relationTargets = this.document.resource.relations['isDepictedIn'];
        if (!relationTargets) return imageDocuments;

        let resultDocuments: Array<IdaiFieldImageDocument> = [];

        for (let imageDocument of imageDocuments) {

            if (relationTargets.indexOf(imageDocument.resource.id as any) == -1) {
                resultDocuments.push(imageDocument);
            }
        }

        return resultDocuments;
    }

}