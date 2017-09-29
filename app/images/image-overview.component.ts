import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {ImageGridBuilder} from '../image-widgets/image-grid-builder';
import {ImageTool} from './image-tool';
import {LinkModalComponent} from './link-modal.component';
import {SettingsService} from '../settings/settings-service';
import {ObjectUtil} from '../util/object-util';
import {ImageTypeUtility} from '../image-widgets/image-type-utility';
import {ImagesState} from './images-state';
import {M} from '../m';
import {ImageGridComponentBase} from '../image-widgets/image-grid-component-base';

@Component({
    moduleId: module.id,
    templateUrl: './image-overview.html'
})
/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent extends ImageGridComponentBase {

    private imageTool: ImageTool;

    private static NR_OF_COLUMNS: number = 4;
    public selected: IdaiFieldImageDocument[] = [];
    public resourceIdentifiers: string[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState
    ) {
        super(
            new ImageGridBuilder(imagestore, true),
            messages,
            ImageOverviewComponent.NR_OF_COLUMNS
        );

        this.imageTool = new ImageTool();

        if (!this.imagesState.getQuery()) this.imagesState.setQuery({ q: '' });

        this.fetchDocuments();
    }

    public onResize() {

        this._onResize(this.el.nativeElement.children[0].clientWidth);
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
            ImageOverviewComponent.insertStub(this.documents);
            this.cacheIdsOfConnectedResources(documents);
            this.calcGrid(this.el.nativeElement.children[0].clientWidth);
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
