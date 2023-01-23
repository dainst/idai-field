import { ImageGeoreference } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export async function getGeoreferenceFromGeotiff(buffer: Buffer): Promise<ImageGeoreference|undefined> {

    const GeoTIFF = await import('geotiff');
    const tiff = await GeoTIFF.fromBlob(new Blob([buffer]));
    const image = await tiff.getImage();
    if (image.getGeoKeys()) {
        return createGeoreference(image.getBoundingBox());
    } else {
        return undefined;
    }
}



function createGeoreference(boundingBox: any): ImageGeoreference {

   return {
        topLeftCoordinates: [boundingBox[1], boundingBox[0]],
        topRightCoordinates: [boundingBox[1], boundingBox[2]],
        bottomLeftCoordinates: [boundingBox[3], boundingBox[0]]
    };
}
