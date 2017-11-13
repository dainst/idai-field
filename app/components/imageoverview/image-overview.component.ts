import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../../core/model/idai-field-image-document';
import {Messages} from 'idai-components-2/messages';
import {LinkModalComponent} from './link-modal.component';
import {ImageGridComponent} from '../imagegrid/image-grid.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';
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

    public jumpToRelationTarget = (documentToSelect: IdaiFieldImageDocument) => this.routingService.jumpToRelationTarget(documentToSelect, undefined, true);


    constructor(
        public viewFacade: ViewFacade,
        private imageOverviewFacade: ImageOverviewFacade,
        private routingService: RoutingService
    ) {
        this.imageOverviewFacade.initialize();
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

        this.imageGrid.calcGrid();
    }


    public refreshGrid() {

        this.imageOverviewFacade.fetchDocuments();
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


    public chooseMainTypeDocumentFilterOption(filterOption: string) {

        this.imageOverviewFacade.chooseMainTypeDocumentFilterOption(filterOption);
    }
}
