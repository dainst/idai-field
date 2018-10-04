import {Component, OnInit, ViewChild} from '@angular/core';
import {Document, Messages} from 'idai-components-2';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {RoutingService} from '../routing-service';
import {IdaiFieldMediaDocument} from '../../core/model/idai-field-media-document';
import {UploadResult} from '../upload/upload-result';
import {M} from '../m';

@Component({
    moduleId: module.id,
    templateUrl: './media-overview.html'
})
/**
<<<<<<< HEAD:app/components/mediaoverview/media-overview.component.ts
 * Displays thumbnails of media resources as a grid of tiles.
 *
=======
>>>>>>> upstream/master:app/components/imageoverview/image-overview.component.ts
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class MediaOverviewComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public maxGridSize: number = 12;
    public minGridSize: number = 2;


    constructor(
        public viewFacade: ViewFacade,
        private mediaOverviewFacade: MediaOverviewFacade,
        private routingService: RoutingService,
        private messages: Messages
    ) {
        this.mediaOverviewFacade.initialize();
    }


    public jumpToRelationTarget
        = (documentToSelect: IdaiFieldMediaDocument) => this.routingService.jumpToRelationTarget(documentToSelect,
        undefined, true);

    public getDocumentLabel = (document: Document) => ModelUtil.getDocumentLabel(document);

    public getDocuments = () => this.mediaOverviewFacade.getDocuments();

    public getSelected = () => this.mediaOverviewFacade.getSelected();

    public getTotalDocumentCount = () => this.mediaOverviewFacade.getTotalDocumentCount();

    public select = (document: Document) => this.mediaOverviewFacade.select(document as IdaiFieldMediaDocument);

    public getGridSize = () => this.mediaOverviewFacade.getGridSize();

    public getQuery = () => this.mediaOverviewFacade.getQuery();

    public getMainTypeDocumentFilterOption = () => this.mediaOverviewFacade.getMainTypeDocumentFilterOption();

    public setQueryString = (q: string) => this.mediaOverviewFacade.setQueryString(q);

    public setTypeFilters = (types: string[]) => this.mediaOverviewFacade.setTypeFilters(types);

    public onResize = () => this.imageGrid.calcGrid();

    public refreshGrid = () => this.mediaOverviewFacade.fetchDocuments();


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.mediaOverviewFacade.getGridSize();
    }


    public async setGridSize(size: string) {

        const _size = parseInt(size);

        if (_size >= this.minGridSize && _size <= this.maxGridSize) {
            this.mediaOverviewFacade.setGridSize(_size);
            this.imageGrid.nrOfColumns = _size;
            await this.refreshGrid();
        }
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.mediaOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
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
