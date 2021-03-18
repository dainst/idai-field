import {ImageDocument} from 'idai-components-2';
import {SafeResourceUrl} from '@angular/platform-browser';


export interface ImageContainer {

    imgSrc?: SafeResourceUrl;
    thumbSrc?: SafeResourceUrl;
    document?: ImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}