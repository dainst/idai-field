import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Category, Document, Datastore, FindResult, NewImageDocument, ImageDocument } from 'idai-field-core';
import { ProjectConfiguration } from '../../../core/configuration/project-configuration';
import { Imagestore } from '../../../core/images/imagestore/imagestore';
import { readWldFile } from '../../../core/images/wld/wld-import';
import { RelationsManager } from '../../../core/model/relations-manager';
import { ExtensionUtil } from '../../../core/util/extension-util';
import { MenuContext, MenuService } from '../../menu-service';
import { M } from '../../messages/m';
import { ImageCategoryPickerModalComponent } from './image-category-picker-modal.component';
import { UploadModalComponent } from './upload-modal.component';
import { UploadStatus } from './upload-status';

export interface ImageUploadResult {

    uploadedImages: number;
    messages: string[][];
}


@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageUploader {

    public static readonly supportedImageFileTypes: string[] = ['jpg', 'jpeg', 'png'];
    public static readonly supportedWorldFileTypes: string[] = ['wld', 'jpgw', 'jpegw', 'jgw', 'pngw', 'pgw'];


    public constructor(private imagestore: Imagestore,
                       private datastore: Datastore,
                       private modalService: NgbModal,
                       private relationsManager: RelationsManager,
                       private projectConfiguration: ProjectConfiguration,
                       private uploadStatus: UploadStatus,
                       private menuService: MenuService) {}


    /**
     * @param event The event containing the images to upload (can be drag event or event from file input element)
     * @param depictsRelationTarget If this parameter is set, each of the newly created image documents will contain
     *  a depicts relation to the specified document.
     */
    public async startUpload(event: Event, depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        let uploadResult: ImageUploadResult = { uploadedImages: 0, messages: [] };

        if (!this.imagestore.getPath()) {
            uploadResult.messages.push([M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]);
            return uploadResult;
        }

        const files = ImageUploader.getFiles(event);
        const message: string[]|undefined = this.checkForUnsupportedFileTypes(files);
        if (message) uploadResult.messages.push(message);

        const imageFiles = files.filter(file =>
            ImageUploader.supportedImageFileTypes.includes(ExtensionUtil.getExtension(file.name)));
        if (imageFiles.length) {
            const category: Category|undefined = await this.chooseCategory(imageFiles.length, depictsRelationTarget);
            if (!category) return uploadResult;

            this.menuService.setContext(MenuContext.MODAL);
            const uploadModalRef = this.modalService.open(
                UploadModalComponent, { backdrop: 'static', keyboard: false }
            );
            uploadResult = await this.uploadImageFiles(
                imageFiles, category, uploadResult, depictsRelationTarget
            );
            uploadModalRef.close();
            this.menuService.setContext(MenuContext.DEFAULT);
        }

        const wldFiles = files.filter(file =>
            ImageUploader.supportedWorldFileTypes.includes(ExtensionUtil.getExtension(file.name)));
        if (wldFiles.length) {
            uploadResult.messages = uploadResult.messages.concat(await this.uploadWldFiles(wldFiles));
        }

        return uploadResult;
    }


    private checkForUnsupportedFileTypes(files: Array<File>): string[]|undefined {

        const supportedFileTypes = ImageUploader.supportedImageFileTypes.concat(ImageUploader.supportedWorldFileTypes);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files, supportedFileTypes);
        if (result[1]) {
            return [
                M.IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS,
                result[1],
                supportedFileTypes.map(extension => '.' + extension).join(', ')
            ];
        }
        return undefined;
    }


    private async chooseCategory(fileCount: number, depictsRelationTarget?: Document): Promise<Category|undefined> {

        const imageCategory = this.projectConfiguration.getCategory('Image');
        if ((imageCategory.children.length > 0)
                || fileCount >= 100 || depictsRelationTarget) {
            this.menuService.setContext(MenuContext.MODAL);
            const modal: NgbModalRef = this.modalService.open(
                ImageCategoryPickerModalComponent, { backdrop: 'static', keyboard: false }
            );

            modal.componentInstance.fileCount = fileCount;
            modal.componentInstance.depictsRelationTarget = depictsRelationTarget;

            try {
                return await modal.result;
            } catch (err) {
                // Modal has been cancelled
                return undefined;
            } finally {
                this.menuService.setContext(MenuContext.DEFAULT);
            }
        } else {
            return imageCategory;
        }
    }


    private async uploadImageFiles(files: Array<File>, category: Category, uploadResult: ImageUploadResult,
                                   depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        if (!files) return uploadResult;

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setHandledImages(0);

        const duplicateFilenames: string[] = [];

        for (let file of files) {
            if (ExtensionUtil.ofUnsupportedExtension(file, ImageUploader.supportedImageFileTypes)) {
                this.uploadStatus.setTotalImages(this.uploadStatus.getTotalImages() - 1);
            } else {
                try {
                    const result = await this.findImageByFilename(file.name);
                    if (result.totalCount > 0) {
                        duplicateFilenames.push(file.name);
                    } else {
                        await this.uploadFile(file, category, depictsRelationTarget);
                    }
                    this.uploadStatus.setHandledImages(this.uploadStatus.getHandledImages() + 1);
                } catch(e) {
                    uploadResult.messages.push(e);
                }
            }
        }

        uploadResult.uploadedImages = this.uploadStatus.getHandledImages() - duplicateFilenames.length;
        if (duplicateFilenames.length == 1) {
            uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
        } else if (duplicateFilenames.length > 1) {
            uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
        }

        return uploadResult;
    }


    private async uploadWldFiles(files: File[]) {

        let messages: string[][] = [];
        let unmatchedWldFiles = [];

        outer: for (let file of files) {
            for (let extension of ImageUploader.supportedImageFileTypes) {
                const candidateName = ExtensionUtil.replaceExtension(file.name, extension);
                const result = await this.findImageByFilename(candidateName);
                if (result.totalCount > 0) {
                    try {
                        await this.saveWldFile(file, result.documents[0]);
                        continue outer;
                    } catch (e) {
                        messages.push(e);
                    }
                }
            }
            unmatchedWldFiles.push(file.name);
        }

        (unmatchedWldFiles.length > 0)
            && messages.push([M.IMAGES_ERROR_UNMATCHED_WLD_FILES, unmatchedWldFiles.join(', ')]);

        const matchedFiles = files.length - unmatchedWldFiles.length;
        (matchedFiles == 1) && messages.push([M.IMAGES_SUCCESS_WLD_FILE_UPLOADED, matchedFiles.toString()]);
        (matchedFiles > 1) && messages.push([M.IMAGES_SUCCESS_WLD_FILES_UPLOADED, matchedFiles.toString()]);

        return messages;
    }


    private async saveWldFile(file: File, document: Document) {

        document.resource.georeference = await readWldFile(file, document);
        await this.relationsManager.update(document);
    }


    private findImageByFilename(filename: string): Promise<FindResult> {

        return this.datastore.find({
            constraints: {
                'identifier:match' : filename
            }
        });
    }


    private uploadFile(file: File, category: Category, depictsRelationTarget?: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, category, depictsRelationTarget)
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_UPLOAD, file.name]);
                        })
                        .then(doc => that.imagestore.create(doc.resource.id, reader.result as any, true).then(async () =>
                            // to refresh the thumbnail in cache, which is done to prevent a conflict afterwards
                            (await this.datastore.get(doc.resource.id, { skipCache: true })) as ImageDocument
                        ))
                        .then(() =>
                            resolve(undefined)
                        )
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_WRITE, file.name]);
                        });
                }
            })(this);
            reader.onerror = () => {
                return (error: any) => {
                    console.error(error);
                    reject([M.IMAGES_ERROR_FILEREADER, file.name]);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }


    private createImageDocument(file: File, category: Category,
                                depictsRelationTarget?: Document): Promise<any> {

        return new Promise((resolve, reject) => {

            let img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const doc: NewImageDocument = {
                    resource: {
                        identifier: file.name,
                        shortDescription: '',
                        category: category.name,
                        originalFilename: file.name,
                        width: img.width,
                        height: img.height,
                        relations: {
                            depicts: []
                        }
                    }
                };

                if (depictsRelationTarget && depictsRelationTarget.resource.id) {
                    doc.resource.relations['depicts'] = [depictsRelationTarget.resource.id];
                }

                this.relationsManager.update(doc)
                    .then((result: any) => resolve(result))
                    .catch((error: any) => reject(error));
            };
            img.onerror = error => reject(error);
        });
    }


    private static getFiles(_event: Event): Array<File> {

        const event = _event as any;

        if (!event) return [];
        let files = [];

        if (event['dataTransfer']) {
            if (event['dataTransfer']['files']) files = event['dataTransfer']['files'];
        } else if (event['srcElement']) {
            if (event['srcElement']['files']) files = event['srcElement']['files'];
        }

        return Array.from(files);
    }
}
