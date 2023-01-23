import { ImageGeoreference, Document } from 'idai-field-core';


export enum Errors {
    FileReaderError,
    InvalidWldFileError
}


export function readWldFile(file: File, doc: Document): Promise<ImageGeoreference> {

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(importWldFile(reader.result as string, doc));
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(Errors.FileReaderError);
        reader.readAsText(file);
    });
}


function importWldFile(wldfileContent: string, doc: Document): ImageGeoreference {

    const cleanedWldfileContent = removeEmptyLines(wldfileContent.split('\n'));
    if (worldFileContentIsValid(cleanedWldfileContent)) {
        return createGeoreference(cleanedWldfileContent, doc);
    } else {
        throw Errors.InvalidWldFileError;
    }
}


function createGeoreference(worldfileContent: string[], doc: Document): ImageGeoreference {

    const width: number = parseInt(doc.resource.width);
    const height: number = parseInt(doc.resource.height);

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
