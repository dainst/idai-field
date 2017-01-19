import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {IdaiFieldImageResource} from "../model/idai-field-image-resource";
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Query, FilterSet} from "idai-components-2/datastore";
import {Mediastore} from "idai-components-2/datastore";
import {ConfigLoader} from "idai-components-2/configuration";
import {DomSanitizer} from '@angular/platform-browser';
import {BlobProxy, ImageContainer} from '../common/blob-proxy';
import {ImageTool} from '../common/image-tool';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LinkModalComponent} from './link-modal.component';
import {FilterUtility} from '../util/filter-utility';

@Component({
    moduleId: module.id,
    templateUrl: './images-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class ImagesGridComponent {

    private blobProxy : BlobProxy;
    private imageTool : ImageTool;

    private query : Query = { q: '' };
    private documents: IdaiFieldImageDocument[];
    private defaultFilterSet: FilterSet;

    private nrOfColumns = 4;
    private rows = [];
    private selected: IdaiFieldImageDocument[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        configLoader: ConfigLoader
    ) {
        this.blobProxy = new BlobProxy(mediastore, sanitizer);
        this.imageTool = new ImageTool(datastore, mediastore);

        var defaultFilterSet = {
            filters: [{field: 'type', value: 'image', invert: false}],
            type: 'or'
        };

        configLoader.configuration().subscribe(result => {
            if (!this.defaultFilterSet) {
                this.defaultFilterSet =
                    FilterUtility.addChildTypesToFilterSet(defaultFilterSet, result.projectConfiguration.getTypesMap());
                this.query = {q: '', filterSets: [this.defaultFilterSet]};
                this.fetchDocuments(this.query);
            }
        });
    }

    public refreshGrid() {
        this.fetchDocuments(this.query);
    }

    public showUploadErrorMsg(msgWithParams) {
        this.messages.addWithParams(msgWithParams);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {
        this.query = query;

        this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldImageDocument[];

            // insert stub document for first cell that will act as drop area for uploading images
            this.documents.unshift({
                id: 'droparea',
                resource: { identifier: '', type: '', width: 1, height: 1, filename: '', relations: {} },
                synced: 0
            });

            this.calcGrid();

        }).catch(err => console.error(err));
    }

    public queryChanged(query: Query) {

        this.query = query;
        this.fetchDocuments(query);
    }

    public onResize() {
        this.calcGrid();
    }

    /*
     * Generate a row of images scaled to height 1 and sum up widths.
     */
    private calcNaturalRowWidth(documents,nrOfColumns,rowIndex) {

        var naturalRowWidth = 0;

        for (var columnIndex = 0; columnIndex < nrOfColumns; columnIndex++) {
            var document = documents[rowIndex * nrOfColumns + columnIndex];
            if (!document) {
                naturalRowWidth += naturalRowWidth * (nrOfColumns - columnIndex) / columnIndex;
                break;
            }
            naturalRowWidth += document.resource.width / parseFloat(document.resource.height);
        }

        return naturalRowWidth;
    }

    public calcGrid() {

        var rowWidth = Math.ceil((window.innerWidth - 57) );

        this.rows = [];
        var nrOfRows = Math.ceil(this.documents.length / this.nrOfColumns);

        for (var rowIndex = 0; rowIndex < nrOfRows; rowIndex++) {

            this.rows[rowIndex] = [];

            var calculatedHeight = rowWidth / this.calcNaturalRowWidth(this.documents,this.nrOfColumns,rowIndex);

            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                var document = this.documents[rowIndex * this.nrOfColumns + columnIndex];
                if (!document) break;

                var cell : ImageContainer = {};
                var image = document.resource as IdaiFieldImageResource;
                cell.document = document;
                cell.calculatedWidth = image.width * calculatedHeight / image.height;
                cell.calculatedHeight = calculatedHeight;
                if (document.resource.identifier) this.blobProxy.setImgSrc(cell).catch(err=>{
                    this.messages.addWithParams(err);
                });
                this.rows[rowIndex][columnIndex] = cell;
            }

        }

    }

    /**
     * @param documentToSelect the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {
        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public clearSelection() {
        this.selected = [];
    }

    public openDeleteModal(modal) {
        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') {
                var results = this.selected.map(document => this.imageTool.remove(document).catch(err=>{
                    this.messages.add(err);
                }));
                Promise.all(results).then(() => {
                    this.clearSelection();
                    this.fetchDocuments(this.query);
                }).catch(error => {
                    this.messages.add(error);
                });
            }
        });
    }

    public openLinkModal() {
        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.imageTool.updateImageLinks(this.selected, targetDoc).then(() => {
                    this.clearSelection();
                }).catch(error => {
                    this.messages.add(error);
                });
            }
        }, (closeReason) => {
        });
    }



    
}
