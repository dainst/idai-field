import {Component, ElementRef} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Imagestore} from '../imagestore/imagestore';
import {Messages} from 'idai-components-2/messages';
import {Query, Datastore} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

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

    public document: IdaiFieldDocument;
    public selectedDocuments: Array<IdaiFieldImageDocument> = [];
    public rows = [];

    private imageGridBuilder: ImageGridBuilder;
    private query: Query = { q: '', type: 'image', prefix: true };
    private imageDocuments: Array<IdaiFieldImageDocument>;
    private numberOfColumns: number = 3;

    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: Datastore,
        private el: ElementRef,
        imagestore: Imagestore,
    ) {
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);
        this.fetchDocuments(this.query);
    }

    public setDocument(document: IdaiFieldDocument) {

        this.document = document;
    }

    public queryChanged(query: Query) {

        this.query.q = query.q;
        this.fetchDocuments(this.query);
    }

    public onResize() {

        this.calcGrid();
    }

    private calcGrid() {

        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.imageDocuments, this.numberOfColumns, this.el.nativeElement.children[0].clientWidth).then(result => {
            this.rows = result['rows'];
            for (var msgWithParams of result['msgsWithParams']) {
                this.messages.add(msgWithParams);
            }
        });
    }

    /**
     * @param documentToSelect the object that should be selected
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

        this.datastore.find(query).then(documents => {
            this.imageDocuments = this.filterOutAlreadyLinkedImageDocuments(documents as Array<IdaiFieldImageDocument>);
            this.calcGrid();
        }).catch(err => console.error(err));
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