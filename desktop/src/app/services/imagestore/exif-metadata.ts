import ExifReader from 'exifreader';

import { ImageManipulation } from './image-manipulation';


export type ImageMetadata = {
    width: number,
    height: number,
    creator?: string,
    creationDate?: Date
}

/**
 * Returns the relevant subset of image metadata from raw data.
 * @param data the raw Buffer data of an image
 * 
 * @returns The image metadata.
 */
export async function getMetadata(data: Buffer): Promise<ImageMetadata> {
    const {width, height} = await ImageManipulation.getSharpImage(data).metadata()
    const rawExif = ExifReader.load(data);

    console.log(rawExif);

    const result = {
        width: width,
        height: height,
        creator: (rawExif.creator) ? rawExif.creator.description : undefined,
        creationDate: (rawExif['Date Created']) ? new Date(Date.parse(rawExif['Date Created'].description)) : undefined
    }

    console.log(result);

    return result;
}