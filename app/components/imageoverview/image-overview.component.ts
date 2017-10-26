import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../../core/model/idai-field-image-document';
import {ReadDatastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {LinkModalComponent} from './link-modal.component';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';
import {RoutingService} from '../../service/routing-service';

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

    public operationTypeDocuments: Array<Document> = [];
    public totalImageCount: number;

    public maxGridSize: number = 12;
    public minGridSize: number = 2;


    // provide access to static function
    public getDocumentLabel = (document: Document) => ModelUtil.getDocumentLabel(document);

    // for clean and refactor safe template, and to help find usages
    public getDocuments = () => this.imageOverviewFacade.getDocuments();
    public getSelected = () => this.imageOverviewFacade.getSelected();
    public select = (document: Document) => this.imageOverviewFacade.select(document as IdaiFieldImageDocument);
    public clearSelection = () => this.imageOverviewFacade.clearSelection();
    public getGridSize = () => this.imageOverviewFacade.getGridSize();
    public getQuery = () => this.imageOverviewFacade.getQuery();
    public getMainTypeDocumentFilterOption = () => this.imageOverviewFacade.getMainTypeDocumentFilterOption();
    public getDepictsRelationsSelected = () => this.imageOverviewFacade.getDepictsRelationsSelected();
    public getResourceIdentifiers = () => this.imageOverviewFacade.getResourceIdentifiers();
    public jumpToRelationTarget = (documentToSelect: IdaiFieldImageDocument) => this.routingService.jumpToRelationTarget(documentToSelect);


    constructor(
        public viewFacade: ViewFacade,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceHelper: PersistenceHelper,
        private routingService: RoutingService
    ) {
        this.viewFacade.getAllOperationSubtypeWithViewDocuments().then(
            documents => this.operationTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );

        this.imageOverviewFacade.initialize().then(() => {
            this.imageOverviewFacade.fetchDocuments();
            this.updateTotalImageCount();
        });
    }


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.imageOverviewFacade.getGridSize();
    }


    public setGridSize(size: string) {

        const _size = parseInt(size);

        if (_size >= this.minGridSize && _size <= this.maxGridSize) {
            this.imageOverviewFacade.setGridSize(_size);
            this.imageGrid.nrOfColumns = _size;
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

        this.imageOverviewFacade.setQueryString(q);
    }


    public setQueryTypes(types: string[]) {

        this.imageOverviewFacade.setQueryTypes(types);
    }


    public resetSearch() {

        this.imageOverviewFacade.resetSearch();
    }


    public async openDeleteModal(modal: any) {

        if (await this.modalService.open(modal).result == 'delete') this.deleteSelected();
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

        this.imageOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
    }


    private async deleteSelected() {

        await this.persistenceHelper.deleteSelectedImageDocuments();

        this.imageOverviewFacade.clearSelection();
        this.imageOverviewFacade.fetchDocuments();
        this.updateTotalImageCount();
    }


    private async updateTotalImageCount() {

        this.totalImageCount = (await this.datastore.find(
            this.imageOverviewFacade.getDefaultQuery())).length;
    }
}
