import {Component, Input, OnChanges, ViewChild} from '@angular/core';
import {Datastore, FieldDocument, ImageDocument} from 'idai-field-core';
import {ImageGridComponent} from '../../image/grid/image-grid.component';
import {Relations} from 'idai-field-core';
import {ImageRowItem} from '../../../core/images/row/image-row';


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

    constructor(private datastore: Datastore) {}


    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations[Relations.Image.ISDEPICTEDIN]) {
         //   this.loadImages();
        }

        if (this.images) this.documents = this.images.map(_ => _.document) as any;
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: ImageDocument) {

        if (this.selected.indexOf(document) === -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }


    // private loadImages() {
//
        // const imageDocPromises: Array<Promise<Document>> = [];
        // this.documents = [];
        // this.document.resource.relations[Relations.Image.ISDEPICTEDIN].forEach(id => {
            // imageDocPromises.push(this.datastore.get(id));
        // });
//
        // Promise.all(imageDocPromises).then(docs => {
            // this.documents = docs as Array<ImageDocument>;
            // this.documents.sort((a, b) => {
                // return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
            // });
            // this.clearSelection(); TODO enable
        // });
    // }


    public onResize() {

        if (!this.images || this.images.length === 0) return;
        this.imageGrid.calcGrid();
    }
}
