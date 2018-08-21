import {IdaiFieldImageDocument} from 'idai-components-2';


export interface ImageContainer {

    imgSrc?: string;
    thumbSrc?: string;
    document?: IdaiFieldImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}