import {Component, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2/messages';
import {Datastore, Query} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ImageTypeUtility} from './image-type-utility';
import {M} from '../m';
import {ImageGridComponent} from "../imagegrid/image-grid.component";

@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ImagePickerComponent {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: IdaiFieldImageDocument[];

    public document: IdaiFieldDocument;
    public selectedDocuments: Array<IdaiFieldImageDocument> = [];

    private query: Query = { q: '' };

    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: Datastore,
        private el: ElementRef,
        private imageTypeUtility: ImageTypeUtility
    ) {
        this.fetchDocuments(this.query);
    }

    public setDocument(document: IdaiFieldDocument) {

        this.document = document;
    }

    public setQueryString(q: string) {

        this.query.q = q;
        this.fetchDocuments(this.query);
    }

    public onResize() {

        this.imageGrid._onResize(this.el.nativeElement.children[0].clientWidth);
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

        this.imageTypeUtility.getProjectImageTypeNames().then(imageTypeNames => {
            this.query.types = imageTypeNames;
            return this.datastore.find(this.query);
        }).catch(msgWithParams => this.messages.add(msgWithParams)
        ).then(documents => {
            this.documents = this.filterOutAlreadyLinkedImageDocuments(documents as Array<IdaiFieldImageDocument>);
            this.imageGrid.calcGrid(this.el.nativeElement.children[0].clientWidth);
        })
        .catch(errWithParams => {
            console.error('error in find with query', this.query);
            if (errWithParams.length == 2) {
                console.error('error in find, cause', errWithParams[1]);
            }
            this.messages.add([M.ALL_FIND_ERROR]);
        });
    }

    private filterOutAlreadyLinkedImageDocuments(imageDocuments: Array<IdaiFieldImageDocument>)
            : Array<IdaiFieldImageDocument> {

        let relationTargets = this.document.resource.relations['isDepictedIn'];
        if (!relationTargets) return imageDocuments;

        let resultDocuments: Array<IdaiFieldImageDocument> = [];

        for (let imageDocument of imageDocuments) {

            if (relationTargets.indexOf(imageDocument.resource.id) == -1) {
                resultDocuments.push(imageDocument);
            }
        }

        return resultDocuments;
    }

}