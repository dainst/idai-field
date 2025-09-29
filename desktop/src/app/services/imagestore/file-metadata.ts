import ExifReader from 'exifreader';
import { imageSize } from 'image-size';


/**
 * This is a container for __preliminary__ image related metadata before a database document for an image is created.
 */
export type ImageMetadata = {
    category: string,
    height?: number,
    width?: number,
    draughtsmen: string[],
    date?: Date
}


/**
 * Parses a subset of image metadata contained in an image file (exif/xmp/iptc).
 * @param existingMetadata existing metadata that has been set explicitely beforehand. This function will try to fill in fields that are not set yet.
 * @param data the raw Buffer data of an image.
 * 
 * @returns The image metadata.
 */
export async function extendMetadataByFileData(existingMetadata: ImageMetadata, data: Buffer,
                                               parseDraughtsmenFromMetadata: boolean): Promise<ImageMetadata> {

    console.log('Reading file metadata...');

    console.log('Reading image size...');
    const { width, height } = imageSize(data as any);

    console.log('Width:', width);
    console.log('Height:', height);
    
    console.log('Loading metadata via exif reader...');
    const internalMetadata: ExifReader.ExpandedTags = ExifReader.load(data.buffer, { expanded: true });
    console.log('Got metadata:', internalMetadata);

    existingMetadata.width = width;
    existingMetadata.height = height;
    console.log('Reading creation date...');
    existingMetadata.date = getCreationDate(internalMetadata);
    console.log('Got creation date');
    if (parseDraughtsmenFromMetadata) {
        existingMetadata.draughtsmen = [];
        const creator: string = getCreator(internalMetadata);
        if (creator) existingMetadata.draughtsmen.push(creator);
    }

    console.log('Finished reading file metadata');

    return existingMetadata;
}


function getCreator(tags: ExifReader.ExpandedTags): string {

    if (tags.exif && tags.exif.Artist) {
        return tags.exif.Artist.description;
    }

    if (tags.iptc && tags.iptc['By-line']) {
        return tags.iptc['By-line'].description;
    }

    if (tags.xmp && 'creator' in tags.xmp) {
        return tags.xmp['creator'].description;
    }

    return undefined;
}


function getCreationDate(tags: ExifReader.ExpandedTags): Date {

    if (tags.exif && tags.exif.DateTimeOriginal) {
        // Exif encodes the date as "2017:09:09 07:51:31" instead of "2017-09-09 07:51:31".
        let [date, time] = tags.exif.DateTimeOriginal.description.split(' ');
        date = date.replace(':', '-');

        const parsed = new Date(`${date} ${time}`);
        if (parsed.toString() !== 'Invalid Date') return parsed;
    }

    if (tags.iptc && 'Time Created' in tags.iptc && 'Date Created' in tags.iptc) {
        // Combine both iptc tags in order to create valid Date.
        const parsed = new Date(`${tags.iptc['Date Created'].description}T${tags.iptc['Time Created'].description}`);
        if (parsed.toString() !== 'Invalid Date') return parsed;
    }

    if (tags.xmp && 'DateCreated' in tags.xmp) {
        const parsed = new Date(Date.parse(tags.xmp['DateCreated'].description));
        if (parsed.toString() !== 'Invalid Date') return parsed;
    }

    if (tags.exif && tags.exif.DateTime) {
        // Exif encodes the date as "2017:09:09 07:51:31" instead of "2017-09-09 07:51:31".
        // Strictly speaking exif.DateTime describes the last time the image was updated,
        // so we just use it as a last fallback.
        let [date, time] = tags.exif.DateTime.description.split(' ');
        date = date.replace(':', '-');

        const parsed = new Date(`${date} ${time}`);
        if (parsed.toString() !== 'Invalid Date') return parsed;
    }

    return undefined;
}
