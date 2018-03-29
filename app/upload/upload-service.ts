import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ImageUploader} from './image/image-uploader';
import {Object3DUploader} from './object3d/object-3d-uploader';
import {UploadResult} from './upload-result';
import {ExtensionUtil} from '../util/extension-util';
import {M} from '../m';
import {Uploader} from './uploader';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class UploadService {

    constructor(private imageUploader: ImageUploader,
                private object3DUploader: Object3DUploader) {}


    public startUpload(event: Event, relationTarget?: Document): Promise<UploadResult> {

        const uploadResult: UploadResult = { uploadedFiles: 0, messages: [] };

        const files = UploadService.getFiles(event);


        const result = ExtensionUtil.reportUnsupportedFileTypes(files, UploadService.getSupportedFileTypes());
        if (result[1]) uploadResult.messages.push([M.UPLOAD_ERROR_UNSUPPORTED_EXTS, result[1]]);
        if (result[0] == 0) return Promise.resolve(uploadResult);

        const uploader: Uploader|undefined = this.getUploader(files);
        if (!uploader) {
            uploadResult.messages.push([M.UPLOAD_ERROR_FILE_TYPES_MIXED]);
            return Promise.resolve(uploadResult);
        } else {
            return uploader.startUpload(files, uploadResult, relationTarget);
        }
    }


    private getUploader(files: Array<File>): Uploader|undefined {

        const imageFileCount: number = files.filter(file => {
            return ExtensionUtil.isSupported(file, ImageUploader.supportedFileTypes);
        }).length;

        const object3DFileCount: number = files.filter(file => {
            return ExtensionUtil.isSupported(file, Object3DUploader.supportedFileTypes);
        }).length;

        if (imageFileCount > 0 && object3DFileCount == 0) {
            return this.imageUploader;
        } else if (object3DFileCount > 0 && imageFileCount == 0) {
            return this.object3DUploader;
        } else {
            return undefined;
        }
    }


    private static getSupportedFileTypes(): Array<string> {

        return ImageUploader.supportedFileTypes.concat(Object3DUploader.supportedFileTypes);
    }


    private static getFiles(event: any): Array<File> {

        if (event['dataTransfer'] && event['dataTransfer']['files']) {
            return this.toArray(event['dataTransfer']['files']);
        } else if (event['srcElement'] && event['srcElement']['files']) {
            return this.toArray(event['srcElement']['files']);
        }

        return [];
    }


    private static toArray(fileList: FileList): Array<File> {

        const files: Array<File> = [];

        for (let i = 0; i < fileList.length; i++) {
            files.push(fileList.item(i));
        }

        return files;
    }
}