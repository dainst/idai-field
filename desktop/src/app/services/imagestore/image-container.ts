import {ImageDocument} from 'idai-field-core';
import {SafeResourceUrl} from '@angular/platform-browser';


export interface ImageContainer {

    imgSrc?: SafeResourceUrl;
    thumbSrc?: SafeResourceUrl;
    document?: ImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}
