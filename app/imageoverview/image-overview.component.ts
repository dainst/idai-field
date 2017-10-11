import {Component, ElementRef, ViewChild, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ReadDatastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {LinkModalComponent} from './link-modal.component';
import {SettingsService} from '../settings/settings-service';
import {ObjectUtil} from '../util/object-util';
import {ImageTypeUtility} from '../docedit/image-type-utility';
import {ImagesState} from './images-state';
import {M} from '../m';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewUtility} from '../common/view-utility';

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
export class ImageOverviewComponent {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    protected documents: IdaiFieldImageDocument[];

    public selected: IdaiFieldImageDocument[] = [];
    public depictsRelationsSelected: boolean = false;

    public mainTypeDocuments: Array<Document> = [];

    // TODO move this to image-grid component
    public resourceIdentifiers: string[] = [];

    public constructor(
        public viewUtility: ViewUtility,
        private router: Router,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState
    ) {
        this.viewUtility.getMainTypeDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );

        if (!this.imagesState.getQuery()) this.setDefaultQuery();
        this.fetchDocuments();
    }

    public changeGridSize(size) {

        this.imageGrid.nrOfColumns = parseInt(size);
        this.imageGrid.calcGrid();
    }

    public onResize() {

        this.imageGrid._onResize();
    }

    public refreshGrid() {

        this.fetchDocuments();
    }

    public setQueryString(q: string) {

        this.imagesState.getQuery().q = q;
        this.fetchDocuments();
    }

    public setQueryTypes(types: string[]) {

        this.imagesState.getQuery().types = types;
        this.fetchDocuments();
    }

    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {

        this.router.navigate(
            ['images', documentToSelect.resource.id, 'show'],
            { queryParams: { from: 'images' } }
        );
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
                this.addRelationsToSelectedDocuments(targetDoc)
                    .then(() => {
                        this.clearSelection();
                    }).catch(msgWithParams => {
                        this.messages.add(msgWithParams);
                    });
            }
        }, () => {}); // do nothing on dismiss
    }

    public openRemoveLinkModal() {

        // TODO remove entries from resource identifiers necessary?

        this.modalService.open(RemoveLinkModalComponent)
            .result.then( () => {
                this.removeRelationsOnSelectedDocuments().then(() => {
                    this.imageGrid.calcGrid();
                    this.clearSelection();
                })
            }
            , () => {}); // do nothing on dismiss
    }

    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        const query: Query = this.imagesState.getQuery();

        switch(filterOption) {
            case '':
                delete query.constraints;
                break;

            case 'UNLINKED':
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'UNKNOWN' };
                break;

            default:
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'KNOWN' };
        }

        this.fetchDocuments();
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    private fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        return this.datastore.find(query)
            .catch(errWithParams => {
                console.error('ERROR with find using query', query);
                if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
            }).then(documents => {
                if (!documents || documents.length == 0) return Promise.resolve([]);
                if (['', 'UNLINKED'].indexOf(this.imagesState.getMainTypeDocumentFilterOption()) == -1) {
                    return this.applyLinkFilter(documents);
                } else {
                    return Promise.resolve(documents);
                }
            }).then(filteredDocuments => {
                console.log('filteredDocuments', filteredDocuments);
                this.documents = filteredDocuments as Array<IdaiFieldImageDocument>;
                this.cacheIdsOfConnectedResources(this.documents);
            });
    }

    /**
     * @param documents Documents with depicts relation
     * @returns Documents which are linked to the main type resource selected in filter box:
     * 1. Documents which are linked to a resource which contains an isRecordedIn relation to the main type resource
     * 2. Documents which are directly linked to the main type resource
     */
    private applyLinkFilter(documents: Array<Document>): Promise<Array<Document>> {

        const documentMap: { [id: string]: Document } = {};
        const promises: Array<Promise<Document>> = [];
        const mainTypeDocumentId: string = this.imagesState.getMainTypeDocumentFilterOption();

        for (let document of documents) {
            documentMap[document.resource.id] = document;
            for (let targetId of document.resource.relations['depicts']) {
                promises.push(this.datastore.get(targetId));
            }
        }

        let targetDocuments: Array<Document>;

        return Promise.all(promises).then(targetDocs => {
            targetDocuments = targetDocs;

            return this.datastore.find({
                q: '',
                constraints: { 'resource.relations.isRecordedIn': mainTypeDocumentId }
            });
        }).then(recordedDocuments => {
            const filteredDocuments: Array<Document> = [];

            for (let targetDocument of targetDocuments) {
                if (recordedDocuments.indexOf(targetDocument) > -1) {
                    for (let imageId of targetDocument.resource.relations['isDepictedIn']) {
                        const imageDocument = documentMap[imageId];
                        if (imageDocument && filteredDocuments.indexOf(imageDocument) == -1) {
                            filteredDocuments.push(imageDocument);
                        }
                    }
                }
            }

            const result: Array<Document> = [];

            for (let document of documents) {
                if (filteredDocuments.indexOf(document) > -1 ||
                        // Add images directly linked to the main type document
                        document.resource.relations['depicts'].indexOf(mainTypeDocumentId) > -1) {
                    result.push(document);
                }
            }

            return Promise.resolve(result);
        });
    }

    private cacheIdsOfConnectedResources(documents: Array<Document>) {

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

        this.deleteSelectedImageDocuments().then(
            () => {
                this.clearSelection();
                this.fetchDocuments();
            });
    }

    private deleteSelectedImageDocuments(): Promise<any> {
        
        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of this.selected) {
                promise = promise.then(
                    () => this.imagestore.remove(document.resource.id),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                ).then(() => {
                    this.documents.splice(
                        this.documents.indexOf(document), 1);
                })
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }

    private addRelationsToSelectedDocuments(targetDocument: IdaiFieldDocument): Promise<any> {

        this.resourceIdentifiers[targetDocument.resource.id] = targetDocument.resource.identifier;

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of this.selected) {
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

    private removeRelationsOnSelectedDocuments() {

        const promises = [];
        for (let document of this.selected) {

            const oldVersion = JSON.parse(JSON.stringify(document));
            delete document.resource.relations['depicts'];

            promises.push(this.persistenceManager.persist(
                document, this.settingsService.getUsername(),
                oldVersion));
        }
        return Promise.all(promises);
    }

    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {
            if (document.resource.relations['depicts'] && document.resource.relations['depicts'].length > 0) {
                return true;
            }
        }

        return false;
    }

    private setDefaultQuery() {

        const defaultQuery: Query = {
            q: '',
            types: this.imageTypeUtility.getProjectImageTypeNames()
        };

        this.imagesState.setQuery(defaultQuery);
    }
}
