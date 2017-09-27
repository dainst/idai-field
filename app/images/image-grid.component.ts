import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {ImageTool} from './image-tool';
import {LinkModalComponent} from './link-modal.component';
import {SettingsService} from '../settings/settings-service';
import {ObjectUtil} from '../util/object-util';
import {ImageTypeUtility} from '../common/image-type-utility';
import {ImagesState} from './images-state';
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

    private imageGridBuilder: ImageGridBuilder;
    private imageTool: ImageTool;

    private documents: IdaiFieldImageDocument[];

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];
    private resourceIdentifiers: string[] = [];

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridOnResizeRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridOnResizeTimeoutRef = undefined;

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState
    ) {

        this.imageTool = new ImageTool();
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);

        if (!this.imagesState.getQuery()) this.imagesState.setQuery({ q: '' });

        this.fetchDocuments();
    }

    public refreshGrid() {

        this.fetchDocuments();
    }

    public showUploadErrorMsg(msgWithParams) {

        this.messages.add(msgWithParams);
    }

    public setQueryString(q: string) {

        this.imagesState.getQuery().q = q;
        this.fetchDocuments();
    }

    public onResize() {

        clearTimeout(this.calcGridOnResizeTimeoutRef);
        this.calcGridOnResizeTimeoutRef = setTimeout(() => {
            // we just jump out and do not store the recalc request. this could possibly be improved
            if (this.calcGridOnResizeRunning) return;

            this.calcGridOnResizeRunning = true;
            this.calcGrid().then(() => this.calcGridOnResizeRunning = false);
        }, 500);
    }

    public getIdentifier(id: string): string {

        return this.resourceIdentifiers[id];
    }

    /**
     * @param document the object that should be selected
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

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    private fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        this.imageTypeUtility.getProjectImageTypeNames().then(imageTypeNames => {
            query.types = imageTypeNames;
            return this.datastore.find(query);
        }).catch(errWithParams => {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }).then(documents => {
            if (!documents) return;

            this.documents = documents as IdaiFieldImageDocument[];
            ImageGridComponent.insertStub(this.documents);
            this.cacheIdsOfConnectedResources(documents);
            this.calcGrid();
        });
    }

    private calcGrid() {

        this.rows = [];

        return this.imageGridBuilder.calcGrid(
            this.documents,this.nrOfColumns, this.el.nativeElement.children[0].clientWidth).then(result=>{

            this.rows = result['rows'];
            for (let msgWithParams of result['msgsWithParams']) {
                // do not display a msg to the user via messages because there may be two much messages
                // the user will get black image which allows to identify which thumbs are missing
                console.error("error from calcGrid:", msgWithParams);
            }
            if (result['msgsWithParams'] &&
                result['msgsWithParams'].length &&
                result['msgsWithParams'].length > 0) {

                this.messages.add([M.IMAGES_NOT_FOUND]);
            }
        });
    }

    private cacheIdsOfConnectedResources(documents) {

        for (let doc of documents) {
            if (doc.resource.relations['depicts'] && doc.resource.relations['depicts'].constructor === Array)
                for (let resourceId of doc.resource.relations['depicts']) {
                    this.datastore.get(resourceId).then(result => {
                        this.resourceIdentifiers[resourceId] = result.resource.identifier;
                    });
                }
        }
    }

    private deleteSelected() {

        this.deleteImageDocuments(this.selected).then(
            () => {
                this.clearSelection();
                this.fetchDocuments();
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

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of imageDocuments) {
                const oldVersion = JSON.parse(JSON.stringify(imageDocument));

                const depictsEl = ObjectUtil.takeOrMake(imageDocument,
                    'resource.relations.depicts', []);

                if (depictsEl.indexOf(targetDocument.resource.id) == -1) {
                    depictsEl.push(targetDocument.resource.id);
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

    // insert stub document for first cell that will act as drop area for uploading images
    private static insertStub(documents) {

        documents.unshift(<IdaiFieldImageDocument>{
            id: 'droparea',
            resource: { identifier: '', shortDescription:'', type: '',
                width: 1, height: 1, filename: '', relations: {} }
        });
    }
}
