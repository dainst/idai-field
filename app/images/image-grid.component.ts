import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {Datastore, Query, Mediastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {ConfigLoader} from "idai-components-2/configuration";
import {PersistenceManager} from "idai-components-2/persist";
import {DomSanitizer} from "@angular/platform-browser";
import {ImageGridBuilder} from "../common/image-grid-builder";
import {ImageTool} from "../common/image-tool";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LinkModalComponent} from "./link-modal.component";
import {BlobProxy} from "../common/blob-proxy";
import {ElementRef} from "@angular/core";
import {M} from '../m';

@Component({
    moduleId: module.id,
    templateUrl: './image-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageGridComponent {

    private imageGridBuilder : ImageGridBuilder;
    private imageTool : ImageTool;

    private query : Query = {q: '', type: 'image', prefix: true};
    private documents: IdaiFieldImageDocument[];
    private types: Array<string>;

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private mediastore: Mediastore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        sanitizer: DomSanitizer,
        configLoader: ConfigLoader
    ) {
        this.imageTool = new ImageTool();
        this.imageGridBuilder = new ImageGridBuilder(
            new BlobProxy(mediastore, sanitizer), true);

        this.fetchDocuments(this.query);
    }

    public refreshGrid() {
        this.fetchDocuments(this.query);
    }

    public showUploadErrorMsg(msgWithParams) {
        this.messages.add(msgWithParams);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query;

        let p;
        if (!query.q) p = this.datastore.all(query.type);
        else p = this.datastore.find(query);

        p.then(documents => {
            this.documents = documents as IdaiFieldImageDocument[];

            // insert stub document for first cell that will act as drop area for uploading images
            this.documents.unshift(<IdaiFieldImageDocument>{
                id: 'droparea',
                resource: { identifier: '', shortDescription:'', type: '',
                    width: 1, height: 1, filename: '', relations: {} },
                synced: 0
            });

            this.calcGrid();

        }).catch(err => console.error(err));
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
                this.messages.add(msgWithParams);
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
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public clearSelection() {
        this.selected = [];
    }

    public openDeleteModal(modal) {
        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteSelected();
        });
    }

    public openLinkModal() {

        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.updateAndPersistDepictsRelations(this.selected, targetDoc)
                    .then(() => {
                        this.clearSelection();
                    }).catch(keyOfM => {
                        this.messages.add([keyOfM]);
                    });
            }
        }, (closeReason) => {
        });
    }

    private deleteSelected() {

        this.deleteImageDocuments(this.selected).then(
            () => {
                this.clearSelection();
                this.fetchDocuments(this.query);
            }).catch(error => {
                this.messages.add(error); // TODO seems that this can not happen, see catch in fetchDocuments
            });
    }

    private deleteImageDocuments(documents: IdaiFieldImageDocument[], documentIndex: number = 0): Promise<any> {

        let document = documents[documentIndex];

        return this.mediastore.remove(document.resource.identifier)
            .then(() => this.persistenceManager.remove(document, document),
                err => Promise.reject([M.IMAGES_ERROR_DELETE, [document.resource.identifier]]))
            .then(() => {
                if (documentIndex < documents.length - 1) {
                    return this.deleteImageDocuments(documents, ++documentIndex);
                }
                return Promise.resolve();
            })
    }

    private updateAndPersistDepictsRelations(imageDocuments: IdaiFieldImageDocument[],
                 targetDocument: IdaiFieldDocument, imageDocumentIndex: number = 0): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            var imageDocument = imageDocuments[imageDocumentIndex];
            var oldVersion = JSON.parse(JSON.stringify(imageDocument));

            if (!imageDocument.resource.relations["depicts"]) {
                imageDocument.resource.relations["depicts"] = [];
            }

            if (imageDocument.resource.relations["depicts"].indexOf(targetDocument.resource.id) == -1) {
                imageDocument.resource.relations["depicts"].push(targetDocument.resource.id);
            }

            return this.persistenceManager.persist(imageDocument, oldVersion).then(
                () => {
                    if (imageDocumentIndex < imageDocuments.length - 1) {
                        return this.updateAndPersistDepictsRelations(imageDocuments, targetDocument,
                            ++imageDocumentIndex);
                    } else {
                        resolve();
                    }
                }, err => reject(err));
        });
    }
}
