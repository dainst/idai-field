import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';


export interface ImageContainer {

    imgSrc?: string;
    thumbSrc?: string;
    document?: IdaiFieldImageDocument|IdaiField3DDocument;

    // used by ImagesGridComponent
    calculatedWidth?: number;
    calculatedHeight?: number;
}