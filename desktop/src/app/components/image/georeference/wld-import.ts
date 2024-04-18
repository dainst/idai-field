import { ImageGeoreference, Document } from 'idai-field-core';
import { getAsynchronousFs } from '../../../services/getAsynchronousFs';


export enum Errors {
    FileReaderError,
    InvalidWldFileError
}


export async function readWldFile(filePath: string, document: Document): Promise<ImageGeoreference> {

    let fileContent: string;
    try {
        fileContent = await getAsynchronousFs().readFile(filePath, 'utf-8');
    } catch (err) {
        console.error(err);
        throw Errors.FileReaderError;
    }

    return importWldFile(fileContent, document);
}


function importWldFile(wldfileContent: string, document: Document): ImageGeoreference {

    const cleanedWldfileContent = removeEmptyLines(wldfileContent.split('\n'));
    if (worldFileContentIsValid(cleanedWldfileContent)) {
        return createGeoreference(cleanedWldfileContent, document);
    } else {
        throw Errors.InvalidWldFileError;
    }
}


function createGeoreference(worldfileContent: string[], document: Document): ImageGeoreference {

    const width: number = parseInt(document.resource.width);
    const height: number = parseInt(document.resource.height);

    const topLeftCoordinates: [number, number] = computeLatLng(0, 0, worldfileContent);
    const topRightCoordinates: [number, number] = computeLatLng(width - 1, 0, worldfileContent);
    const bottomLeftCoordinates: [number, number] = computeLatLng(0, height - 1, worldfileContent);

    return {
        topLeftCoordinates,
        topRightCoordinates,
        bottomLeftCoordinates
    };
}


function removeEmptyLines(worldfileContent: string[]): string[] {

    const result: string[] = [];

    for (let i in worldfileContent) {
        if (worldfileContent[i].length > 0) {
            result.push(worldfileContent[i]);
        }
    }

    return result;
}


function worldFileContentIsValid(worldfileContent: string[]): boolean {

    if (worldfileContent.length != 6) {
        return false;
    }

    for (let i in worldfileContent) {
        const number = parseFloat(worldfileContent[i]);
        if (isNaN(number)) return false;
    }

    return true;
}


function computeLatLng(imageX: number, imageY: number, worldfileContent: string[]): [number, number] {

    const latPosition: number = parseFloat(worldfileContent[3]) * imageY;
    const latRotation: number = parseFloat(worldfileContent[1]) * imageX;
    const latTranslation: number = parseFloat(worldfileContent[5]);
    const lat: number = latPosition + latRotation + latTranslation;

    const lngPosition: number = parseFloat(worldfileContent[0]) * imageX;
    const lngRotation: number = parseFloat(worldfileContent[2]) * imageY;
    const lngTranslation: number = parseFloat(worldfileContent[4]);
    const lng: number = lngPosition + lngRotation + lngTranslation;

    return [lat, lng];
}
