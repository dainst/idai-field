import {Component, EventEmitter, Input, OnChanges, SimpleChanges, Output, ElementRef} from '@angular/core';
import {flatten} from 'tsfun';
import {Datastore, ImageDocument} from 'idai-field-core';
import {Document} from 'idai-field-core';
import {ImageUploadResult} from '../upload/image-uploader';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {constructGrid} from '../../../core/images/grid/construct-grid';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';


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
    @Input() totalDocumentCount: number = 0;
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showGeoIcon: boolean = false;
    @Input() showTooltips: boolean = false;
    @Input() showDropArea: boolean = false;
    @Input() compressDropArea: boolean = false;
    @Input() dropAreaDepictsRelationTarget: Document;
    @Input() paddingRight: number;

    @Output() onClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDoubleClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onImagesUploaded: EventEmitter<ImageUploadResult> = new EventEmitter<ImageUploadResult>();

    public rows = [];
    public resourceIdentifiers: { [id: string]: string } = {};

    private calcGridTimeout: any;
    private calcGridPromise: Promise<void>|undefined;


    constructor(private element: ElementRef,
                private imagestore: Imagestore,
                private datastore: Datastore,
                private blobMaker: BlobMaker) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (!changes['documents']) return;

        if (this.showDropArea) this.insertStubForDropArea();
        this.calcGrid();
    }


    public async onCellMouseEnter(doc: ImageDocument) {

        if (!this.showLinkBadges) return;

        for (let depictsRelId of doc.resource.relations.depicts) {

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

        const imageData: { [imageId: string]: Blob } = await this.getImageData(rows);

        for (let row of rows) {
            for (let cell of row) {
                if (!cell.document
                    || !cell.document.resource
                    || !cell.document.resource.id
                    || cell.document.resource.id === 'droparea') continue;

                if (imageData[cell.document.resource.id] ) {
                    cell.imgSrc = this.blobMaker.makeBlob(imageData[cell.document.resource.id]).safeResourceUrl;
                }
            }
        }
    }


    private getImageData(rows: any): Promise<{ [imageId: string]: Blob }> {

        const imageIds: string[] =
            (flatten(rows.map(row => row.map(cell => cell.document.resource.id))) as any)
                .filter(id => id !== 'droparea');

        return this.imagestore.readThumbnails(imageIds);
    }


    /**
     * Insert stub document for first cell that will act as drop area for uploading images
     */
    private insertStubForDropArea() {

        if (this.documents &&
            this.documents.length > 0 &&
            this.documents[0] &&
            this.documents[0].id &&
            this.documents[0].id == 'droparea') return;

        if (!this.documents) this.documents = [];

        this.documents.unshift({
            id: 'droparea',
            resource: { id: 'droparea', identifier: '', shortDescription:'', category: '',
                originalFilename: '', width: 1, height: this.compressDropArea ? 0.2 : 1,
                relations: { depicts: [] }
            }
        } as any);
    }
}
