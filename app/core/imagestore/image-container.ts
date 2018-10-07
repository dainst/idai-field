import {IdaiFieldMediaDocument} from '../model/idai-field-media-document';


export interface ImageContainer {

    imgSrc?: string;
    thumbSrc?: string;
    document?: IdaiFieldMediaDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}