import {Component, OnInit, ViewChild} from '@angular/core';
import {Document, IdaiFieldImageDocument, Messages} from 'idai-components-2';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {RoutingService} from '../routing-service';
import {ImageUploadResult} from '../imageupload/image-uploader';
import {M} from '../m';
import {ImageFilterOption} from './view/images-state';

@Component({
    moduleId: module.id,
    templateUrl: './image-overview.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public maxGridSize: number = 12;
    public minGridSize: number = 2;

    public jumpToRelationTarget
        = (documentToSelect: IdaiFieldImageDocument) => this.routingService.jumpToRelationTarget(documentToSelect,
            undefined, true);


    constructor(public viewFacade: ViewFacade,
                private imageOverviewFacade: ImageOverviewFacade,
                private routingService: RoutingService,
                private messages: Messages) {

        this.imageOverviewFacade.initialize();
    }


    public getDocumentLabel = (document: Document) => ModelUtil.getDocumentLabel(document);

    public getDocuments = () => this.imageOverviewFacade.getDocuments();

    public getSelected = () => this.imageOverviewFacade.getSelected();

    public getTotalDocumentCount = () => this.imageOverviewFacade.getTotalDocumentCount();

    public select = (document: Document) => this.imageOverviewFacade.select(document as IdaiFieldImageDocument);

    public getGridSize = () => this.imageOverviewFacade.getGridSize();

    public getQuery = () => this.imageOverviewFacade.getQuery();

    public getMainTypeDocumentFilterOption = () => this.imageOverviewFacade.getMainTypeDocumentFilterOption();

    public setQueryString = (q: string) => this.imageOverviewFacade.setQueryString(q);

    public setTypeFilters = (types: string[]) => this.imageOverviewFacade.setTypeFilters(types);

    public onResize = () => this.imageGrid.calcGrid();

    public refreshGrid = () => this.imageOverviewFacade.fetchDocuments();


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.imageOverviewFacade.getGridSize();
    }


    public async setGridSize(size: string|number) {

        const _size: number = typeof size === 'string' ? parseInt(size): size;

        if (_size >= this.minGridSize && _size <= this.maxGridSize) {
            this.imageOverviewFacade.setGridSize(_size);
            this.imageGrid.nrOfColumns = _size;
            await this.refreshGrid();
        }
    }


    public chooseMainTypeDocumentFilterOption(filterOption: ImageFilterOption) {

        this.imageOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
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
