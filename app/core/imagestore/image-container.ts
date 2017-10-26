import {IdaiFieldImageDocument} from '../model/idai-field-image-document';


export interface ImageContainer {


    imgSrc?: string;
    thumbSrc?: string;
    document?: IdaiFieldImageDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;

    // used by MapComponent
    zIndex?: number;
    object?: L.ImageOverlay;
}