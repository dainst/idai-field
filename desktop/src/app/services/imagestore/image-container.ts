import { SafeResourceUrl } from '@angular/platform-browser';
import { ImageDocument } from 'idai-field-core';


export interface ImageContainer {

    imgSrc?: SafeResourceUrl;
    thumbSrc?: SafeResourceUrl;
    document?: ImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}
