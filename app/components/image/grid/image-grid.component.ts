import {Component, EventEmitter, Input, OnChanges, SimpleChanges, Output, ElementRef} from '@angular/core';
import {Messages, Document, ImageDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageUploadResult} from '../upload/image-uploader';
import {showMissingImageMessageOnConsole} from '../log-messages';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {constructGrid} from '../../../core/images/grid/construct-grid';


@Component({
    selector: 'image-grid',
    moduleId: module.id,
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

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridTimeoutRef: any = undefined;


    constructor(
        private el: ElementRef,
        private messages: Messages,
        private imagestore: Imagestore,
        private datastore: FieldReadDatastore
    ) {}


    ngOnChanges(changes: SimpleChanges) {

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


    public calcGrid() {

        clearTimeout(this.calcGridTimeoutRef as any);
        this.calcGridTimeoutRef = setTimeout(async () => {
            // we just jump out and do not store the recalc request. this could possibly be improved
            if (this.calcGridRunning) return;

            this.calcGridRunning = true;
            await this._calcGrid();
            this.calcGridRunning = false;
        }, 500);
    }


    private async _calcGrid() {

        if (!this.documents) return;

        const rows = constructGrid(
            this.documents, this.nrOfColumns, this.el.nativeElement.children[0].clientWidth,
            this.paddingRight
        );

        await this.loadImages(rows);
        this.rows = rows;
    }


    private async loadImages(rows: any) {

        for (let row of rows) {
            for (let cell of row) {

                if (!cell.document
                    || !cell.document.resource
                    || !cell.document.resource.id
                    || cell.document.resource.id === 'droparea') continue;

                try {
                    cell.imgSrc = await this.imagestore.read(cell.document.resource.id)
                } catch(e) {
                    showMissingImageMessageOnConsole(cell.document.resource.id);
                }
            }
        }
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
