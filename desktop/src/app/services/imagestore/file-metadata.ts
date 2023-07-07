import ExifReader from 'exifreader';
import { ImageManipulation } from './image-manipulation';

/**
 * This is a container for __preliminary__ image related metadata before a database document for an image is created.
 */
export type ImageMetadata = {
    category: string,
    height?: number,
    width?: number
    draughtsmen: string[],
    processor: string[],
    creationDate?: Date,
    copyright?: string,
}

/**
 * Parses a subset of image metadata contained in an image file (exif/xmp/iptc).
 * @param data the raw Buffer data of an image.
 * 
 * @returns The image metadata.
 */
export async function readFileMetadata(explicitlySetMetadata: ImageMetadata, data: Buffer): Promise<ImageMetadata> {
    const { width, height } = await ImageManipulation.getSharpImage(data).metadata();
    const internalMetadata: ExifReader.ExpandedTags = ExifReader.load(data, {expanded: true});

    explicitlySetMetadata.width = width;
    explicitlySetMetadata.height = height;
    explicitlySetMetadata.creationDate = getCreationDate(internalMetadata);
    if(explicitlySetMetadata.draughtsmen.length == 0) {
        const creator = getCreator(internalMetadata);
        if(creator) explicitlySetMetadata.draughtsmen.push(creator);
    }
    explicitlySetMetadata.copyright = getCopyright(internalMetadata);
    return explicitlySetMetadata;
}

function getCreator(tags: ExifReader.ExpandedTags) {

    if(tags.exif && tags.exif.Artist) {
        return tags.exif.Artist.description;
    }

    if(tags.iptc && tags.iptc['By-line']) {
        return tags.iptc['By-line'].description;
    }

    if(tags.xmp && 'creator' in tags.xmp) {
        return tags.xmp['creator'].description
    }

    return undefined
}

function getCreationDate(tags: ExifReader.ExpandedTags) {

    if(tags.exif && tags.exif.DateTimeOriginal) {
        // Exif encodes the date as "2017:09:09 07:51:31" instead of "2017-09-09 07:51:31".
        let [date, time] = tags.exif.DateTimeOriginal.description.split(" ");
        date = date.replace(':', '-');

        let parsed = new Date(`${date} ${time}`);
        if(parsed.toString() !== 'Invalid Date') return parsed;
    }

    if(tags.iptc && 'Time Created' in tags.iptc && 'Date Created' in tags.iptc) {
        // Combine both iptc tags in order to create valid Date.
        let parsed = new Date(`${tags.iptc['Date Created'].description}T${tags.iptc['Time Created'].description}`)
        if(parsed.toString() !== 'Invalid Date') return parsed;
    }

    if(tags.xmp && 'DateCreated' in tags.xmp) {
        let parsed = new Date(Date.parse(tags.xmp['DateCreated'].description))
        if(parsed.toString() !== 'Invalid Date') return parsed;
    }


    if(tags.exif && tags.exif.DateTime) {
        // Exif encodes the date as "2017:09:09 07:51:31" instead of "2017-09-09 07:51:31".
        // Strictly speaking exif.DateTime describes the last time the image was updated, so we just use it as a last fallback.
        let [date, time] = tags.exif.DateTime.description.split(" ");
        date = date.replace(':', '-');

        let parsed = new Date(`${date} ${time}`);
        if(parsed.toString() !== 'Invalid Date') return parsed;
    }

    return undefined;
}

function getCopyright(tags: ExifReader.ExpandedTags) {
    if(tags.exif && tags.exif.Copyright) {
        return tags.exif.Copyright.description;
    }

    if(tags.iptc && tags.iptc.Copyright) {
        return tags.iptc.Copyright.description
    }

    if(tags.iptc && 'Copyright Notice' in tags.iptc) {
        return tags.iptc['Copyright Notice'].description
    }

    return undefined;
}
