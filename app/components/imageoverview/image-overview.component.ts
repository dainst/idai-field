import {Component, OnInit, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {RoutingService} from '../routing-service';

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

    public maxGridSize: number = 12;
    public minGridSize: number = 2;

    public jumpToRelationTarget
        = (documentToSelect: IdaiFieldImageDocument) => this.routingService.jumpToRelationTarget(documentToSelect,
            undefined, true);


    constructor(
        public viewFacade: ViewFacade,
        private imageOverviewFacade: ImageOverviewFacade,
        private routingService: RoutingService
    ) {
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

    public resetSearch = () => this.imageOverviewFacade.resetSearch();


    public ngOnInit() {

        this.imageGrid.nrOfColumns = this.imageOverviewFacade.getGridSize();
    }


    public setGridSize(size: string) {

        const _size = parseInt(size);

        if (_size >= this.minGridSize && _size <= this.maxGridSize) {
            this.imageOverviewFacade.setGridSize(_size);
            this.imageGrid.nrOfColumns = _size;
            this.refreshGrid();
        }
    }


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.imageOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
    }
}
