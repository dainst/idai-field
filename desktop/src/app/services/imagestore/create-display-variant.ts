import { ImageDocument, ImageStore } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 * 
 * @returns A buffer containing data of a newly created display variant, or undefined if no display variant is needed.
 */
export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                           originalData: Buffer): Promise<Buffer|undefined> {
    
    console.log('--- Always use original variant temporarily---');
    const imageId: string = document.resource.id;
    await imagestore.addUseOriginalMarker(imageId);
    return undefined;
}
