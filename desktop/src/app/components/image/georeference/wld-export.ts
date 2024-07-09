import { ImageDocument } from 'idai-field-core';
import { ExtensionUtil } from '../../../util/extension-util';
import { AppState } from '../../../services/app-state';
import { ImageUploader } from '../upload/image-uploader';

const remote = window.require('@electron/remote');
const fs = window.require('fs');


export async function downloadWldFile(imageDocument: ImageDocument, appState: AppState) {

    const content: string = getWldFileContent(imageDocument);
    const fileName: string = ExtensionUtil.replaceExtension(imageDocument.resource.identifier, 'wld');
    const filePath: string = await openFileSelectionDialog(fileName, appState);

    if (filePath) fs.writeFileSync(filePath, content);
}


function getWldFileContent(imageDocument: ImageDocument): string {

    if (!imageDocument.resource.georeference) {
        throw Error('No georeference present in the document');
    }

    let lines: number[] = [];
    const georef = imageDocument.resource.georeference;
    const width = imageDocument.resource.width - 1;
    const height = imageDocument.resource.height - 1;

    lines[0] = (georef.topRightCoordinates[1] - georef.topLeftCoordinates[1]) / width;
    lines[1] = (georef.topRightCoordinates[0] - georef.topLeftCoordinates[0]) / height;
    lines[2] = (georef.bottomLeftCoordinates[1] - georef.topLeftCoordinates[1]) / width;
    lines[3] = (georef.bottomLeftCoordinates[0] - georef.topLeftCoordinates[0]) / height;
    lines[4] = georef.topLeftCoordinates[1];
    lines[5] = georef.topLeftCoordinates[0];

    return lines.map((x: number) => x).join('\n');
}


async function openFileSelectionDialog(fileName: string, appState: AppState): Promise<string> {

    const defaultPath: string = getDefaultPath(fileName, appState);

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(
        {
            defaultPath,
            filters: [
                {
                    name: 'Worldfile',
                    extensions: ImageUploader.supportedWorldFileTypes
                }
            ]
        }
    );

    const filePath: string = saveDialogReturnValue.filePath;
    
    if (filePath) {
        if (appState) appState.setFolderPath(filePath, 'worldfileExport');
        return filePath;
    } else {
        return undefined;
    }
}


function getDefaultPath(fileName: string, appState: AppState): string {

    const folderPath: string = appState?.getFolderPath('worldfileExport');

    return folderPath
        ? folderPath + '/' + fileName
        : fileName;
}
