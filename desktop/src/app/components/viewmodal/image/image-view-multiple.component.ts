import {Component, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {FieldDocument, ImageDocument} from 'idai-field-core';
import {ImageGridComponent} from '../../image/grid/image-grid.component';
import {ImageRowItem} from '../../../core/images/row/image-row';
import {ImageUploadResult} from '../../image/upload/image-uploader';


@Component({
    selector: 'image-view-multiple',
    templateUrl: './image-view-multiple.html'
})
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class ImageViewMultipleComponent implements OnChanges {

    @ViewChild('imageGrid', { static: false }) public imageGrid: ImageGridComponent;

    @Input() document: FieldDocument;

    // This set up was introduced to get rid of flickering of images
    @Input() images: Array<ImageRowItem> = [];
    public documents: Array<ImageDocument>;
    // -

    @Input() selected: Array<ImageDocument> = [];

    @Output() onImagesUploaded = new EventEmitter<ImageUploadResult>();


    ngOnChanges() {

        if (this.images) this.documents = this.images.map(_ => _.document) as any;
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: ImageDocument) {

        if (this.selected.indexOf(document) === -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }


    public onResize() { // TODO review

        if (!this.images || this.images.length === 0) return;
        this.imageGrid.calcGrid();
    }
}
