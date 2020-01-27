import {ImageDocument} from 'idai-components-2';


export interface ImageContainer {

    imgSrc?: string;
    thumbSrc?: string;
    document?: ImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}