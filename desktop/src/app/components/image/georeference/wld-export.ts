import { ImageDocument } from 'idai-field-core';
import { ExtensionUtil } from '../../../util/extension-util';


export function downloadWldFile(imageDoc: ImageDocument) {

    const content = getWldFileContent(imageDoc);
    const fileName = ExtensionUtil.replaceExtension(imageDoc.resource.identifier, 'wld');
    triggerDownload(content, fileName);
}


function triggerDownload(content: string, fileName: string) {

    const link = document.createElement('a');
    const blob = new Blob([content], { type: 'application/octet-stream;charset=utf-8' });
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}


function getWldFileContent(imageDoc: ImageDocument): string {

    if (!imageDoc.resource.georeference)
        throw Error('No georefence present in the document');

    let lines: number[] = [];
    const georef = imageDoc.resource.georeference;
    const width = imageDoc.resource.width - 1;
    const height = imageDoc.resource.height - 1;

    lines[0] = (georef.topRightCoordinates[1] - georef.topLeftCoordinates[1]) / width;
    lines[1] = (georef.topRightCoordinates[0] - georef.topLeftCoordinates[0]) / height;
    lines[2] = (georef.bottomLeftCoordinates[1] - georef.topLeftCoordinates[1]) / width;
    lines[3] = (georef.bottomLeftCoordinates[0] - georef.topLeftCoordinates[0]) / height;
    lines[4] = georef.topLeftCoordinates[1];
    lines[5] = georef.topLeftCoordinates[0];
    return lines.map((x: number) => x).join('\n');
}
