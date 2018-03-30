import {Component, OnInit, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {RoutingService} from '../routing-service';
import {IdaiFieldMediaDocument} from '../../core/model/idai-field-media-document';

@Component({
    moduleId: module.id,
    templateUrl: './media-overview.html'
})
/**
 * Displays thumbnails of media resources as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class MediaOverviewComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public maxGridSize: number = 12;
    public minGridSize: number = 2;


    // provide access to static function
    public getDocumentLabel = (document: Document) => ModelUtil.getDocumentLabel(document);

    // for clean and refactor safe template, and to help find usages
    public getDocuments = () => this.mediaOverviewFacade.getDocuments();
    public getSelected = () => this.mediaOverviewFacade.getSelected();
    public getTotalDocumentCount = () => this.mediaOverviewFacade.getTotalDocumentCount();
    public select = (document: Document) => this.mediaOverviewFacade.select(document as IdaiFieldMediaDocument);
    public getGridSize = () => this.mediaOverviewFacade.getGridSize();
    public getQuery = () => this.mediaOverviewFacade.getQuery();
    public getMainTypeDocumentFilterOption = () => this.mediaOverviewFacade.getMainTypeDocumentFilterOption();

    public jumpToRelationTarget
        = (documentToSelect: IdaiFieldMediaDocument) => this.routingService.jumpToRelationTarget(documentToSelect,
            undefined, true);


    constructor(
        public viewFacade: ViewFacade,
        private mediaOverviewFacade: MediaOverviewFacade,
        private routingService: RoutingService
    ) {
        this.mediaOverviewFacade.initialize();
    }


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.mediaOverviewFacade.getGridSize();
    }


    public setGridSize(size: string) {

        const _size = parseInt(size);

        if (_size >= this.minGridSize && _size <= this.maxGridSize) {
            this.mediaOverviewFacade.setGridSize(_size);
            this.imageGrid.nrOfColumns = _size;
            this.refreshGrid();
        }
    }


    public onResize() {

        this.imageGrid.calcGrid();
    }


    public refreshGrid() {

        this.mediaOverviewFacade.fetchDocuments();
    }


    public setQueryString(q: string) {

        this.mediaOverviewFacade.setQueryString(q);
    }


    public setQueryTypes(types: string[]) {

        this.mediaOverviewFacade.setQueryTypes(types);
    }


    public resetSearch() {

        this.mediaOverviewFacade.resetSearch();
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.mediaOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
    }
}
