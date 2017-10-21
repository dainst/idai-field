import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Query, ReadDatastore} from 'idai-components-2/datastore';
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
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../model/model-util';
import {DocumentsManager} from './documents-manager';

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
export class ImageOverviewComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;


    public mainTypeDocuments: Array<Document> = [];

    public totalImageCount: number;

    public selected: Array<IdaiFieldImageDocument> = [];
    public depictsRelationsSelected: boolean = false;



    public maxGridSize: number = 6; // TODO before increasing this, make sure there is a solution to display the info box properly, or that it gets hidden automatically if images get too small or there are too many columns
    public minGridSize: number = 2;


    public getDocumentLabel = (document) => ModelUtil.getDocumentLabel(document);


    constructor(
        public viewFacade: ViewFacade,
        private router: Router,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState,
        private documentsManager: DocumentsManager
    ) {
        this.viewFacade.getAllOperationTypeDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );

        this.imagesState.initialize().then(() => {
            if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
            this.setQueryConstraints();
            this.documentsManager.fetchDocuments();
            this.updateTotalImageCount();
        });
    }


    public getDocuments = () => this.documentsManager.getDocuments();


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.imagesState.getGridSize();
    }


    public setGridSize(size) {

        if (size >= this.minGridSize && size <= this.maxGridSize) {
            this.imagesState.setGridSize(parseInt(size));
            this.imageGrid.nrOfColumns = parseInt(size);
            this.imageGrid.calcGrid();
        }
    }


    public onResize() {

        this.imageGrid._onResize();
    }


    public refreshGrid() {

        this.documentsManager.fetchDocuments();
        this.updateTotalImageCount();
    }

    public setQueryString(q: string) {

        const query: Query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.documentsManager.fetchDocuments();
    }

    public setQueryTypes(types: string[]) {

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.documentsManager.fetchDocuments();
    }


    public resetSearch() {

        this.imagesState.setQuery(this.getDefaultQuery());
        this.imagesState.setMainTypeDocumentFilterOption('');
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

        this.imagesState.setMainTypeDocumentFilterOption(filterOption);
        this.setQueryConstraints();

        this.documentsManager.fetchDocuments();
    }


    private setQueryConstraints() {

        const query: Query = this.imagesState.getQuery();

        switch(this.imagesState.getMainTypeDocumentFilterOption()) {
            case '':
                delete query.constraints;
                break;

            case 'UNLINKED':
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'UNKNOWN' };
                break;

            default:
                this.imagesState.getQuery().constraints = { 'resource.relations.depicts': 'KNOWN' };
        }
    }


    private deleteSelected() {

        this.deleteSelectedImageDocuments().then(
            () => {
                this.clearSelection();
                this.documentsManager.fetchDocuments();
                this.updateTotalImageCount();
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
                    this.documentsManager.remove(document);
                })
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }


    private addRelationsToSelectedDocuments(targetDocument: IdaiFieldDocument): Promise<any> {

        this.documentsManager.cacheIdentifier(targetDocument);

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


    private getDefaultQuery(): Query {

        return {
            q: '',
            types: this.imageTypeUtility.getProjectImageTypeNames()
        };
    }


    private updateTotalImageCount() {

        this.datastore.find(this.getDefaultQuery())
            .then(documents => this.totalImageCount = documents.length);
    }
}
