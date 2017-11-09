import {
    Component, EventEmitter, Input, OnChanges, SimpleChanges, Output,
    ElementRef
} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldImageDocument} from '../../core/model/idai-field-image-document';
import {ImageGridBuilder, ImageGridBuilderResult} from './image-grid-builder';
import {M} from '../../m';
import {Imagestore} from "../../core/imagestore/imagestore";
import {IdaiFieldDocumentReadDatastore} from "../../core/datastore/idai-field-document-read-datastore";


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
    @Input() documents: IdaiFieldImageDocument[];
    @Input() selected: IdaiFieldImageDocument[] = [];
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showDropArea: boolean = false;
    @Input() showGeoIcon: boolean = false;
    @Input() showTooltips: boolean = false;

    @Output() onClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDoubleClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onImagesUploaded: EventEmitter<any> = new EventEmitter<any>();

    public resourceIdentifiers: {[id: string]: string} = {};

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridOnResizeRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridOnResizeTimeoutRef: any = undefined;

    // it should be avoided that while being in an image overview and thumbs are missing,
    // that the missing images messages is shown more than once, as it would happen
    // on a recalculation of the grid on resize.
    // only if the user leaves the component and comes back again,
    // the message would be displayed again.
    private imagesNotFoundMessageDisplayed = false;

    private rows = [];


    constructor(
        private el: ElementRef,
        private imageGridBuilder: ImageGridBuilder,
        private messages: Messages,
        private imagestore: Imagestore,
        private datastore: IdaiFieldDocumentReadDatastore
    ) {
    }


    public async onCellMouseEnter(doc: IdaiFieldImageDocument) {

        if (!this.showLinkBadges) return;

        for (let depictsRelId of doc.resource.relations.depicts) {

            if (!this.resourceIdentifiers[depictsRelId]) {
                const target = await this.datastore.get(depictsRelId);
                this.resourceIdentifiers[depictsRelId] = target.resource.identifier;
            }
        }
    }


    public getIdentifier(id: string): string|undefined {

        if (!this.resourceIdentifiers ||
            (Object.keys(this.resourceIdentifiers).length < 1)) {
                return undefined;
        }
        return this.resourceIdentifiers[id as any];
    }


    ngOnChanges(changes: SimpleChanges) {

        if (!changes['documents']) return;
        if (this.showDropArea) this.insertStubForDropArea();
        this._calcGrid();
    }


    private _calcGrid() {

        this.rows = [];

        let clientWidth = this.el.nativeElement.children[0].clientWidth;

        if (!this.documents) return;

        console.debug("calc grid start")
        const rows = this.imageGridBuilder.calcGrid(this.documents, this.nrOfColumns, clientWidth)
        console.debug("calc grid end")

        // this.rows = rows;

        let promise = Promise.resolve();
        for (let row of rows) {
            for (let cell of row) {
                if (!cell.document || !cell.document.resource || !cell.document.resource.id) continue;

                promise = this.imagestore.read(cell.document.resource.id).then(url => {
                    console.log("cell",cell.document.resource.id)
                    cell.imgSrc = url;
                }).catch(e => {
                    console.error('error fetching img',e)
                })
            }
        }
        promise.then(() => {
            this.rows = rows;
            this.calcGridOnResizeRunning = false;
            console.log("rows",rows.length)
        })

        // this.rows = result['rows'];
        // for (let errWithParams of result.errsWithParams) {
        //     do not display a msg to the user via messages because there may be two much messages
        //     the user will get black image which allows to identify which thumbs are missing
            // console.error('error from calcGrid:', errWithParams);
        // }
        // this.showImagesNotFoundMessage(result);

    }


    public calcGrid() {

        clearTimeout(this.calcGridOnResizeTimeoutRef as any);
        this.calcGridOnResizeTimeoutRef = setTimeout(() => {
            // we just jump out and do not store the recalc request. this could possibly be improved
            if (this.calcGridOnResizeRunning) return;

            this.calcGridOnResizeRunning = true;
            this._calcGrid();
        }, 500);
    }


    private showImagesNotFoundMessage(result: ImageGridBuilderResult) {

        if (result.errsWithParams &&
            result.errsWithParams.length &&
            result.errsWithParams.length > 0 &&
            !this.imagesNotFoundMessageDisplayed) {

            this.messages.add([M.IMAGES_N_NOT_FOUND]);
            this.imagesNotFoundMessageDisplayed = true;
        }
    }


    // insert stub document for first cell that will act as drop area for uploading images
    private insertStubForDropArea() {

        if (this.documents &&
            this.documents.length > 0 &&
            this.documents[0] &&
            this.documents[0].id &&
            this.documents[0].id == 'droparea') return;

        if (!this.documents) this.documents = [];

        this.documents.unshift(<IdaiFieldImageDocument>{
            id: 'droparea',
            resource: { identifier: '', shortDescription:'', type: '', originalFilename: '',
                width: 1, height: 1, relations: { depicts: [] } }
        });
    }
}
