import ExifReader from 'exifreader';

export type ImageMetadata = {
    creator?: string,
    creationDate?: Date,
    copyright?: string,
    height: number,
    width: number
}

/**
 * Parses a subset of image metadata contained in an image file.
 * @param data the raw Buffer data of an image.
 * 
 * @returns The image metadata.
 */
export async function getMetadata(data: Buffer): Promise<ImageMetadata> {
    const rawExif: ExifReader.ExpandedTags = ExifReader.load(data, {expanded: true});
    const { width, height } = await ImageManipulation.getSharpImage(data).metadata();

    return {
        width,
        height,
        creationDate: getCreationDate(rawExif)
    };
}

function getCreator(tags: ExifReader.ExpandedTags) {
    if(tags.exif && tags.exif.Artist) {
        return tags.exif.Artist.description;
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
