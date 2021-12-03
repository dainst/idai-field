import {Input, Component, OnChanges, SimpleChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {ImageUrlMaker} from '../../../services/imagestore/image-url-maker';
import { FieldDocument } from 'idai-field-core';

@Component({
    selector: 'type-grid-element',
    templateUrl: './type-grid-element.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridElementComponent/* implements OnChanges */{

    @Input() document: FieldDocument;
    @Input() images: Array<SafeResourceUrl>;
    @Input() subtype?: FieldDocument;

    // public imageUrls: Array<SafeResourceUrl> = [];


    constructor(private imageUrlMaker: ImageUrlMaker) {}


    // async ngOnChanges(changes: SimpleChanges) {

    //     if (changes['document'] || changes['images']) await this.loadImages();
    // }


    // private async loadImages() {

    //     for(const url in this.images){
    //         await url;

    //     }

    //     // if (!this.images) return;

    //     // for (let blob of this.images) {
    //     //     const url = this.blobMaker.makeBlob(blob);
    //     //     this.imageUrls.push(url.safeResourceUrl);
    //     // }
    // }
}
