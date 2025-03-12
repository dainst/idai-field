import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';

const fs = window.require('fs');

const ERROR_ORIGINAL_IMAGE_FILE_NOT_FOUND: string = 'exportImage.error.originalImageFileNotFound';


/**
 * 
 * @author Thomas Kleinke
 */
export function exportImages(imageStore: ImageStore, imageDocuments: Array<ImageDocument>, 
                             targetDirectoryPath: string, project: string, useOriginalFilenames: boolean) {

    copyImageFiles(imageStore, imageDocuments, targetDirectoryPath, project, useOriginalFilenames);
}


function copyImageFiles(imageStore: ImageStore, imageDocuments: Array<ImageDocument>,
                        targetDirectoryPath: string, project: string, useOriginalFilenames: boolean) {

    const imagesDirectoryPath: string = imageStore.getDirectoryPath(project, ImageVariant.ORIGINAL);

    imageDocuments.forEach(imageDocument => {
        copyImageFile(imageDocument, imagesDirectoryPath, targetDirectoryPath, useOriginalFilenames);
    });
}


function copyImageFile(imageDocument: ImageDocument, imagesDirectoryPath: string,
                       targetDirectoryPath: string, useOriginalFilename: boolean) {

    const sourceFilePath: string = imagesDirectoryPath + imageDocument.resource.id;
    if (!fs.existsSync(sourceFilePath)) {
        throw [ERROR_ORIGINAL_IMAGE_FILE_NOT_FOUND, imageDocument.resource.identifier];
    }

    fs.copyFileSync(
        sourceFilePath,
        targetDirectoryPath + '/' + getTargetFileName(imageDocument, useOriginalFilename)
    );
}


function getTargetFileName(imageDocument: ImageDocument, useOriginalFilename: boolean): string {

    if (useOriginalFilename) {
        return imageDocument.resource.originalFilename;
    } else {
        const fileExtension: string = imageDocument.resource.originalFilename.split('.').pop();
        let targetFileName: string = imageDocument.resource.identifier;
        if (!imageDocument.resource.identifier.toLowerCase().endsWith('.' + fileExtension.toLowerCase())) {
            targetFileName += '.' + fileExtension;
        }
        return targetFileName;
    }
}
