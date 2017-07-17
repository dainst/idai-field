import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Imagestore} from '../imagestore/imagestore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {ImageTool} from './image-tool';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LinkModalComponent} from './link-modal.component';
import {ElementRef} from '@angular/core';
import {SettingsService} from '../settings/settings-service';
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

    private query : Query = {type: 'image', prefix: true};
    private documents: IdaiFieldImageDocument[];

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];
    private resourceIdentifiers: string[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService
    ) {
        this.imageTool = new ImageTool();
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);

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
                    width: 1, height: 1, filename: '', relations: {} }
            });

            // cache ids of connected resources
            for (let doc of documents) {
                if (doc.resource.relations['depicts'] && doc.resource.relations['depicts'].constructor === Array)
                    for (let resourceId of doc.resource.relations['depicts']) {
                        this.datastore.get(resourceId).then(result => {
                            this.resourceIdentifiers[resourceId] = result.resource.identifier;
                        });
                    }
            }

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

    public getIdentifier(id: string): string {
        return this.resourceIdentifiers[id];
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
                    }).catch(msgWithParams => {
                        this.messages.add(msgWithParams);
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

    private deleteImageDocuments(documents: Array<IdaiFieldImageDocument>): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of documents) {
                promise = promise.then(
                    () => this.imagestore.remove(document.resource.id),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                )
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }

    private updateAndPersistDepictsRelations(imageDocuments: Array<IdaiFieldImageDocument>,
                 targetDocument: IdaiFieldDocument): Promise<any> {

        this.resourceIdentifiers[targetDocument.resource.id] = targetDocument.resource.identifier;
        console.log("asdf", this.resourceIdentifiers);

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of imageDocuments) {
                const oldVersion = JSON.parse(JSON.stringify(imageDocument));

                if (!imageDocument.resource.relations['depicts']) {
                    imageDocument.resource.relations['depicts'] = [];
                }

                if (imageDocument.resource.relations['depicts'].indexOf(targetDocument.resource.id) == -1) {
                    imageDocument.resource.relations['depicts'].push(targetDocument.resource.id);
                }

                promise = promise.then(
                    () => this.persistenceManager.persist(imageDocument, this.settingsService.getUsername(),
                            [oldVersion]),
                    msgWithParams => reject(msgWithParams)
                );
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }
}
