import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Query, ReadDatastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {LinkModalComponent} from './link-modal.component';
import {ImageTypeUtility} from '../docedit/image-type-utility';
import {ImagesState} from './images-state';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../model/model-util';
import {ImageOverviewFacade} from './imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';

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

    public maxGridSize: number = 6; // TODO before increasing this, make sure there is a solution to display the info box properly, or that it gets hidden automatically if images get too small or there are too many columns
    public minGridSize: number = 2;


    // provide access to static function
    public getDocumentLabel = (document) => ModelUtil.getDocumentLabel(document);

    // for clean and refactor safe template
    public getDocuments = () => this.imageOverviewFacade.getDocuments();
    public getSelected = () => this.imageOverviewFacade.getSelected();
    public select = (document) => this.imageOverviewFacade.select(document);
    public clearSelection = () => this.imageOverviewFacade.clearSelection();


    constructor(
        public viewFacade: ViewFacade,
        private router: Router,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState, // TODO hide behind facade
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceHelper: PersistenceHelper
    ) {
        this.viewFacade.getAllOperationTypeDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );

        this.imagesState.initialize().then(() => {
            if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
            this.setQueryConstraints();
            this.imageOverviewFacade.fetchDocuments();
            this.updateTotalImageCount();
        });
    }


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

        this.imageOverviewFacade.fetchDocuments();
        this.updateTotalImageCount();
    }


    public setQueryString(q: string) {

        const query: Query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.imageOverviewFacade.fetchDocuments();
    }


    public setQueryTypes(types: string[]) {

        const query: Query = this.imagesState.getQuery();
        query.types = types;
        this.imagesState.setQuery(query);

        this.imageOverviewFacade.fetchDocuments();
    }


    public resetSearch() {

        this.imagesState.setQuery(this.getDefaultQuery());
        this.imagesState.setMainTypeDocumentFilterOption('');
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


    public openDeleteModal(modal) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteSelected();
        });
    }


    public openLinkModal() {

        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.persistenceHelper.addRelationsToSelectedDocuments(targetDoc)
                    .then(() => {
                        this.imageOverviewFacade.clearSelection();
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
                this.persistenceHelper.removeRelationsOnSelectedDocuments().then(() => {
                    this.imageGrid.calcGrid();
                    this.imageOverviewFacade.clearSelection();
                })
            }
            , () => {}); // do nothing on dismiss
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.imagesState.setMainTypeDocumentFilterOption(filterOption);
        this.setQueryConstraints();

        this.imageOverviewFacade.fetchDocuments();
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

        this.persistenceHelper.deleteSelectedImageDocuments().then(
            () => {
                this.imageOverviewFacade.clearSelection();
                this.imageOverviewFacade.fetchDocuments();
                this.updateTotalImageCount();
            });
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
