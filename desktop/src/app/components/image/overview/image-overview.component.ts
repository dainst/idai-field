import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ImageDocument, Document, Category, Datastore} from 'idai-field-core';
import {ImageGridComponent} from '../grid/image-grid.component';
import {ImageOverviewFacade} from '../../../core/images/overview/view/imageoverview-facade';
import {ImageUploadResult} from '../upload/image-uploader';
import {ImageViewModalComponent} from '../../viewmodal/image/image-view-modal.component';
import {MenuContext, MenuService} from '../../menu-service';
import {M} from '../../messages/m';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {TabManager} from '../../../core/tabs/tab-manager';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Messages} from '../../messages/messages';


@Component({
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

    @ViewChild('imageGrid', { static: true }) public imageGrid: ImageGridComponent;

    public filterOptions: Array<Category> = [];


    constructor(route: ActivatedRoute,
                location: Location,
                public viewFacade: ViewFacade,
                private imageOverviewFacade: ImageOverviewFacade,
                private datastore: Datastore,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private modalService: NgbModal,
                private menuService: MenuService) {

        this.imageOverviewFacade.initialize();
        route.params.subscribe(async (params) => {
            if (params['id']) {
                location.replaceState('images/');
                await this.openConflictResolver(params['id']);
            }
        });
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

    public toggleSelected = (document: Document, multiSelect?: boolean) =>
        this.imageOverviewFacade.toggleSelected(document as ImageDocument, multiSelect);

    public getQuery = () => this.imageOverviewFacade.getQuery();

    public setCategoryFilters = (categories: string[]) => this.imageOverviewFacade.setCategoryFilters(categories);

    public setQueryString = (q: string) => this.imageOverviewFacade.setQueryString(q);

    public onResize = () => this.imageGrid.calcGrid();

    public refreshGrid = () => this.imageOverviewFacade.fetchDocuments();

    public turnPage = () => this.imageOverviewFacade.turnPage();

    public turnPageBack = () => this.imageOverviewFacade.turnPageBack();

    public canTurnPage = () => this.imageOverviewFacade.canTurnPage();

    public canTurnPageBack = () => this.imageOverviewFacade.canTurnPageBack();

    public nrOfSelectedImages = () => this.getSelected().length;

    public hasSelectedImages = () => this.getSelected().length > 0;


    ngOnInit() {

        this.imageGrid.nrOfColumns = this.imageOverviewFacade.getNrImagesPerRow();
        this.filterOptions = [this.projectConfiguration.getCategory('Image')];
    }


    public async setNrImagesPerRow(nrImagesPerRow: string|number) {

        const nr: number = typeof nrImagesPerRow === 'string'
            ? parseInt(nrImagesPerRow)
            : nrImagesPerRow;

        this.imageOverviewFacade.setNrImagesPerRow(nr);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT && !this.hasSelectedImages()) {
            await this.tabManager.openActiveTab();
        }
    }


    public async showImage(document: ImageDocument, openConflictResolver: boolean = false) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            openConflictResolver
                ? [document]
                : this.getDocuments().filter(document => document.id !== 'droparea'),
            document
        );
        if (openConflictResolver) {
            await modalRef.componentInstance.startEdit(true, 'conflicts');
        }
        await modalRef.result;

        this.menuService.setContext(MenuContext.DEFAULT);
    }


    public async onImagesUploaded(uploadResult: ImageUploadResult) {

        if (uploadResult.uploadedImages > 1) {
            this.messages.add([M.IMAGES_SUCCESS_IMAGES_UPLOADED,
                uploadResult.uploadedImages.toString()]);
        }

        await this.refreshGrid();
    }


    private async openConflictResolver(id: string) {

        const image = (await this.datastore.get(id)) as ImageDocument;
        this.showImage(image, true);
    }
}
