import { Component, EventEmitter, Input, OnChanges, SimpleChanges, Output, ElementRef } from '@angular/core';
import { Datastore, ImageDocument, ImageVariant } from 'idai-field-core';
import { constructGrid } from './construct-grid';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';


const DROPAREA = 'droparea';


@Component({
    selector: 'image-grid',
    templateUrl: './image-grid.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridComponent implements OnChanges {

    @Input() nrOfColumns: number = 1;
    @Input() documents: Array<ImageDocument>;
    @Input() selected: Array<ImageDocument> = [];
    @Input() main: ImageDocument|undefined;
    @Input() totalDocumentCount = 0;
    @Input() showLinkBadges = true;
    @Input() showIdentifier = true;
    @Input() showShortDescription = true;
    @Input() showGeoIcon = false;
    @Input() showTooltips = false;
    @Input() showDropArea = false;
    @Input() compressDropArea = false;
    @Input() paddingRight: number;

    @Output() onClick = new EventEmitter<any>();
    @Output() onShiftClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDoubleClick = new EventEmitter<any>();

    public rows = [];
    public resourceIdentifiers: { [id: string]: string } = {};

    private calcGridTimeout: any;
    private calcGridPromise: Promise<void>|undefined;


    constructor(private element: ElementRef,
                private datastore: Datastore,
                private imageUrlMaker: ImageUrlMaker) {}


    public async handleClick(document: ImageDocument, event: MouseEvent) {
        
        if (event.shiftKey) {
            this.onShiftClick.emit(document);
        } else {
            this.onClick.emit(document);
        }
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (!changes['documents']) return;

        if (this.showDropArea) this.insertStubForDropArea();
        this.calcGrid();
    }


    public async onCellMouseEnter(doc: ImageDocument) {

        if (!this.showLinkBadges) return;

        for (const depictsRelId of doc.resource.relations.depicts) {

            if (!this.resourceIdentifiers[depictsRelId]) {
                const target = await this.datastore.get(depictsRelId);
                this.resourceIdentifiers[depictsRelId] = target.resource.identifier;
            }
        }
    }


    public async calcGrid() {

        if (this.calcGridTimeout) clearTimeout(this.calcGridTimeout);

        this.calcGridTimeout = setTimeout(async () => {
            this.calcGridPromise = this.calcGridPromise
                ? this.calcGridPromise.then(() => this._calcGrid())
                : this._calcGrid();

            await this.calcGridPromise;

            this.calcGridPromise = undefined;
            this.calcGridTimeout = undefined;
        }, 100);
    }


    private async _calcGrid() {

        if (!this.documents) return;

        const rows = constructGrid(
            this.documents,
            this.nrOfColumns,
            this.element.nativeElement.children[0].clientWidth,
            this.paddingRight
        );

        await this.loadImages(rows);
        this.rows = rows;
    }


    private async loadImages(rows: any) {

        for (const row of rows) {
            for (const cell of row) {
                if (
                    !cell.document
                    || !cell.document.resource
                    || !cell.document.resource.id
                    || cell.document.resource.id === DROPAREA
                ) continue;

                cell.imgSrc = await this.imageUrlMaker.getUrl(cell.document.resource.id, ImageVariant.THUMBNAIL);
            }
        }
    }


    /**
     * Insert stub document for first cell that will act as drop area for uploading images
     */
    private insertStubForDropArea() {

        if (this.documents?.[0]?.id === DROPAREA) return;

        if (!this.documents) this.documents = [];

        this.documents = [{
            id: DROPAREA,
            resource: {
                id: DROPAREA,
                identifier: '',
                shortDescription:'',
                category: '',
                originalFilename: '',
                width: 1,
                height: this.compressDropArea ? 0.2 : 1,
                relations: { depicts: [] }
            }
        } as any].concat(this.documents);
    }
}
