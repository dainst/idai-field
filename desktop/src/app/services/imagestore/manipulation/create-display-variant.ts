import { ImageDocument, ImageStore } from 'idai-field-core';
import { SharpDisplayVariantCreation } from './sharp/sharp-display-variant-creation';
import { JimpDisplayVariantCreation } from './jimp/jimp-display-variant-creation';

const remote = window.require('@electron/remote');
const imageProcessing: 'sharp'|'jimp' = remote?.getGlobal('imageProcessing') ?? 'sharp';

console.log('Using image processing library: ' + imageProcessing);


/**
 * @author Thomas Kleinke
 * 
 * @returns A buffer containing data of a newly created display variant, or undefined if no display variant is needed.
 */
export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                           originalData: Buffer): Promise<Buffer|undefined> {
    
    return imageProcessing === 'sharp'
        ? SharpDisplayVariantCreation.createDisplayVariant(document, imagestore, originalData)
        : JimpDisplayVariantCreation.createDisplayVariant(document, imagestore, originalData);
};
