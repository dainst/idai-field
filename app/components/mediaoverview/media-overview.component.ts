import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document, Messages} from 'idai-components-2';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {RoutingService} from '../routing-service';
import {UploadResult} from '../upload/upload-result';
import {M} from '../m';
import {TabManager} from '../tab-manager';
import {ImageViewComponent} from '../imageview/image-view.component';
import {MenuService} from '../../menu-service';
import {IdaiFieldMediaDocument} from '../../core/model/idai-field-media-document';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';


@Component({
    moduleId: module.id,
    templateUrl: './media-overview.html',
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
export class MediaOverviewComponent implements OnInit {

    @ViewChild('imageGrid', { static: true }) public imageGrid: ImageGridComponent;

    public filterOptions: Array<IdaiType> = [];
    public modalOpened: boolean = false;


    constructor(public viewFacade: ViewFacade,
                private mediaOverviewFacade: MediaOverviewFacade,
                private routingService: RoutingService,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private modalService: NgbModal) {

        this.mediaOverviewFacade.initialize();
    }

    public increaseNrMediaResourcesPerRow = () => this.mediaOverviewFacade.increaseNrMediaResourcesPerRow();

    public decreaseNrMediaResourcesPerRow = () => this.mediaOverviewFacade.decreaseNrMediaResourcesPerRow();

    public getMaxNrMediaResourcesPerRow = () => this.mediaOverviewFacade.getMaxNrMediaResourcesPerRow();

    public getMinNrMediaResourcesPerRow = () => this.mediaOverviewFacade.getMinNrMediaResourcesPerRow();

    public getNrMediaResourcesPerRow = () => this.mediaOverviewFacade.getNrMediaResourcesPerRow();

    public getDocuments = () => this.mediaOverviewFacade.getDocuments();

    public getSelected = () => this.mediaOverviewFacade.getSelected();

    public getTotalDocumentCount = () => this.mediaOverviewFacade.getTotalDocumentCount();

    public getPageCount = () => this.mediaOverviewFacade.getPageCount();

    public getCurrentPage = () => this.mediaOverviewFacade.getCurrentPage();

    public toggleSelected = (document: Document) => this.mediaOverviewFacade.toggleSelected(document as IdaiFieldMediaDocument);

    public getQuery = () => this.mediaOverviewFacade.getQuery();

    public setTypeFilters = (types: string[]) => this.mediaOverviewFacade.setTypeFilters(types);

    public setQueryString = (q: string) => this.mediaOverviewFacade.setQueryString(q);

    public onResize = () => this.imageGrid.calcGrid();

    public refreshGrid = () => this.mediaOverviewFacade.fetchDocuments();

    public turnPage = () => this.mediaOverviewFacade.turnPage();

    public turnPageBack = () => this.mediaOverviewFacade.turnPageBack();

    public canTurnPage = () => this.mediaOverviewFacade.canTurnPage();

    public canTurnPageBack = () => this.mediaOverviewFacade.canTurnPageBack();

    public nrOfSelectedMediaResources = () => this.getSelected().length;

    public hasSelectedMediaResources = () => this.getSelected().length > 0;


    ngOnInit() {

        this.imageGrid.nrOfColumns = this.mediaOverviewFacade.getNrMediaResourcesPerRow();
        this.filterOptions = [
            this.projectConfiguration.getTypesTree()['Image'],
            this.projectConfiguration.getTypesTree()['Model3D']
        ];
    }


    public async setNrMediaResourcesPerRow(nrMediaResourcesPerRow: string|number) {

        const nr: number = typeof nrMediaResourcesPerRow === 'string'
            ? parseInt(nrMediaResourcesPerRow)
            : nrMediaResourcesPerRow;

        this.mediaOverviewFacade.setNrMediaResourcesPerRow(nr);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpened
            && !this.hasSelectedMediaResources()) {
            await this.tabManager.openActiveTab();
        }
    }


    public async showMediaResource(document: IdaiFieldMediaDocument) {

        this.modalOpened = true;
        MenuService.setContext('image-view');

        this.mediaOverviewFacade.select(document);

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


    public async onFilesUploaded(uploadResult: UploadResult) {

        this.messages.add(
            uploadResult.uploadedFiles > 1
                ? [M.MEDIA_SUCCESS_FILES_UPLOADED, uploadResult.uploadedFiles.toString()]
                : [M.MEDIA_SUCCESS_FILE_UPLOADED]
        );

        await this.refreshGrid();
    }
}
