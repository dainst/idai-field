import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document, IdaiType, ImageDocument, Messages, ProjectConfiguration} from 'idai-components-2';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {RoutingService} from '../routing-service';
import {ImageUploadResult} from '../imageupload/image-uploader';
import {M} from '../m';
import {ImageFilterOption} from './view/images-state';
import {TabManager} from '../tab-manager';
import {ImageViewComponent} from '../imageview/image-view.component';
import {MenuService} from '../../menu-service';


@Component({
    moduleId: module.id,
    templateUrl: './image-overview.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public filterOptions: Array<IdaiType> = [];
    public modalOpened: boolean = false;


    constructor(public viewFacade: ViewFacade,
                private imageOverviewFacade: ImageOverviewFacade,
                private routingService: RoutingService,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private modalService: NgbModal) {

        this.imageOverviewFacade.initialize();
    }

    public increaseNrImagesPerRow = () => this.imageOverviewFacade.increaseNrImagesPerRow();

    public decreaseNrImagesPerRow = () => this.imageOverviewFacade.decreaseNrImagesPerRow();

    public getMaxNrImagesPerRow = () => this.imageOverviewFacade.getMaxNrImagesPerRow();

    public getMinNrImagesPerRow = () => this.imageOverviewFacade.getMinNrImagesPerRow();

    public getNrImagesPerRow = () => this.imageOverviewFacade.getNrImagesPerRow();

    public getDocuments = () => this.imageOverviewFacade.getDocuments();

    public getSelected = () => this.imageOverviewFacade.getSelected();

    public getTotalDocumentCount = () => this.imageOverviewFacade.getTotalDocumentCount();

    public getPageCount = () => this.imageOverviewFacade.getPageCount();

    public getCurrentPage = () => this.imageOverviewFacade.getCurrentPage();

    public toggleSelected = (document: Document) => this.imageOverviewFacade.toggleSelected(document as ImageDocument);

    public getQuery = () => this.imageOverviewFacade.getQuery();

    public setTypeFilters = (types: string[]) => this.imageOverviewFacade.setTypeFilters(types);

    public getLinkFilter = () => this.imageOverviewFacade.getLinkFilter();

    public setQueryString = (q: string) => this.imageOverviewFacade.setQueryString(q);

    public onResize = () => this.imageGrid.calcGrid();

    public refreshGrid = () => this.imageOverviewFacade.fetchDocuments();

    public turnPage = () => this.imageOverviewFacade.turnPage();

    public turnPageBack = () => this.imageOverviewFacade.turnPageBack();

    public canTurnPage = () => this.imageOverviewFacade.canTurnPage();

    public canTurnPageBack = () => this.imageOverviewFacade.canTurnPageBack();

    public setLinkFilter = (filterOption: ImageFilterOption) => this.imageOverviewFacade.setLinkFilter(filterOption);

    public nrOfSelectedImages = () => this.getSelected().length;

    public hasSelectedImages = () => this.getSelected().length > 0;


    ngOnInit() {

        this.imageGrid.nrOfColumns = this.imageOverviewFacade.getNrImagesPerRow();
        this.filterOptions = [this.projectConfiguration.getTypesTree()['Image']];
    }


    public async setNrImagesPerRow(nrImagesPerRow: string|number) {

        const nr: number = typeof nrImagesPerRow === 'string'
            ? parseInt(nrImagesPerRow)
            : nrImagesPerRow;

        this.imageOverviewFacade.setNrImagesPerRow(nr);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpened
            && !this.hasSelectedImages()) {
            await this.tabManager.openActiveTab();
        }
    }


    public async showImage(document: ImageDocument) {

        this.modalOpened = true;
        MenuService.setContext('image-view');

        this.imageOverviewFacade.select(document);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            this.getDocuments().filter(document => document.id !== 'droparea'),
            document
        );
        await modalRef.result;

        this.modalOpened = false;
        MenuService.setContext('default');
    }


    public async onImagesUploaded(uploadResult: ImageUploadResult) {

        this.messages.add(
            uploadResult.uploadedImages > 1
                ? [M.IMAGES_SUCCESS_IMAGES_UPLOADED, uploadResult.uploadedImages.toString()]
                : [M.IMAGES_SUCCESS_IMAGE_UPLOADED]
        );

        await this.refreshGrid();
    }
}
