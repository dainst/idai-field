import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';


type ImageData = {
    originalData?: Buffer;
    image?: any;
};


/**
 * @author Thomas Kleinke
 * 
 * @returns buffer data of the created display variant or undefined if no display variant is needed
 */
export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                           originalData?: Buffer): Promise<Buffer|undefined> {

    return undefined;
};
