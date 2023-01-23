import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Document, Datastore, NewImageDocument, ProjectConfiguration, RelationsManager, 
    ImageStore, ImageGeoreference } from 'idai-field-core';
import { readWldFile } from '../georeference/wld-import';
import { ExtensionUtil } from '../../../util/extension-util';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { M } from '../../messages/m';
import { ImageCategoryPickerModalComponent } from './image-category-picker-modal.component';
import { UploadModalComponent } from './upload-modal.component';
import { UploadStatus } from './upload-status';
import { ImageManipulation } from '../../../services/imagestore/image-manipulation';
import { getGeoreferenceFromGeotiff } from '../georeference/geotiff-import';


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

    public static readonly supportedImageFileTypes: string[] = ['jpg', 'jpeg', 'png', 'tif', 'tiff'];
    public static readonly supportedWorldFileTypes: string[]
        = ['wld', 'jpgw', 'jpegw', 'jgw', 'pngw', 'pgw', 'tifw', 'tiffw', 'tfw'];


    public constructor(private imagestore: ImageStore,
                       private datastore: Datastore,
                       private modalService: NgbModal,
                       private relationsManager: RelationsManager,
                       private projectConfiguration: ProjectConfiguration,
                       private uploadStatus: UploadStatus,
                       private menuService: Menus) {}


    /**
     * @param event The event containing the images to upload (can be drag event or event from file input element)
     * @param depictsRelationTarget If this parameter is set, each of the newly created image documents will contain
     *  a depicts relation to the specified document.
     */
    public async startUpload(event: Event, depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        let uploadResult: ImageUploadResult = { uploadedImages: 0, messages: [] };

        if (!this.imagestore.getAbsoluteRootPath()) {
            uploadResult.messages.push([M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]);
            return uploadResult;
        }

        const files = ImageUploader.getFiles(event);
        const message: string[]|undefined = this.checkForUnsupportedFileTypes(files);
        if (message) uploadResult.messages.push(message);

        const imageFiles = files.filter(file =>
            ImageUploader.supportedImageFileTypes.includes(ExtensionUtil.getExtension(file.name)));
        if (imageFiles.length) {
            const category: CategoryForm|undefined = await this.chooseCategory(imageFiles.length, depictsRelationTarget);
            if (!category) return uploadResult;

            this.menuService.setContext(MenuContext.MODAL);
            const uploadModalRef = this.modalService.open(
                UploadModalComponent, { backdrop: 'static', keyboard: false, animation: false }
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


    private async chooseCategory(fileCount: number,
                                 depictsRelationTarget?: Document): Promise<CategoryForm|undefined> {

        const imageCategory = this.projectConfiguration.getCategory('Image');
        if ((imageCategory.children.length > 0)
                || fileCount >= 100 || depictsRelationTarget) {
            this.menuService.setContext(MenuContext.MODAL);
            const modal: NgbModalRef = this.modalService.open(
                ImageCategoryPickerModalComponent, { backdrop: 'static', keyboard: false, animation: false }
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


    private async uploadImageFiles(files: Array<File>, category: CategoryForm, uploadResult: ImageUploadResult,
                                   depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        if (!files) return uploadResult;

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setHandledImages(0);

        const duplicateFilenames: string[] = [];

        for (const file of files) {
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
                } catch (e) {
                    uploadResult.messages.push(e);
                }
            }
        }

        uploadResult.uploadedImages = this.uploadStatus.getHandledImages() - duplicateFilenames.length;
        if (duplicateFilenames.length === 1) {
            uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
        } else if (duplicateFilenames.length > 1) {
            uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
        }

        return uploadResult;
    }


    private async uploadWldFiles(files: File[]) {

        const messages: string[][] = [];
        const unmatchedWldFiles = [];

        outer: for (const file of files) {
            for (const extension of ImageUploader.supportedImageFileTypes) {
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

        if (unmatchedWldFiles.length > 0) messages.push([M.IMAGES_ERROR_UNMATCHED_WLD_FILES, unmatchedWldFiles.join(', ')]);

        const matchedFiles = files.length - unmatchedWldFiles.length;
        if (matchedFiles === 1) messages.push([M.IMAGES_SUCCESS_WLD_FILE_UPLOADED, matchedFiles.toString()]);
        if (matchedFiles > 1) messages.push([M.IMAGES_SUCCESS_WLD_FILES_UPLOADED, matchedFiles.toString()]);

        return messages;
    }


    private async saveWldFile(file: File, document: Document) {

        document.resource.georeference = await readWldFile(file, document);
        await this.relationsManager.update(document);
    }


    private findImageByFilename(filename: string): Promise<Datastore.FindResult> {

        return this.datastore.find({
            constraints: {
                'identifier:match' : filename
            }
        });
    }


    private uploadFile(file: File, category: CategoryForm, depictsRelationTarget?: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            const reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    const buffer: Buffer = Buffer.from(reader.result);
                    that.createImageDocument(file.name, buffer, category, depictsRelationTarget)
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_UPLOAD, file.name]);
                        })
                        .then(doc => that.imagestore.store(doc.resource.id, buffer))
                        .then(() =>
                            resolve(undefined)
                        )
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_WRITE, file.name]);
                        });
                };
            })(this);
            reader.onerror = () => {
                return (error: any) => {
                    console.error(error);
                    reject([M.IMAGES_ERROR_FILEREADER, file.name]);
                };
            };
            reader.readAsArrayBuffer(file);
        });
    }


    private async createImageDocument(fileName: string, buffer: Buffer, category: CategoryForm,
                                      depictsRelationTarget?: Document): Promise<any> {

        const { width, height } = await ImageManipulation.getSize(buffer);

        const document: NewImageDocument = {
            resource: {
                identifier: fileName,
                category: category.name,
                originalFilename: fileName,
                width,
                height,
                relations: {
                    depicts: []
                }
            }
        };

        if (depictsRelationTarget && depictsRelationTarget.resource.id) {
            document.resource.relations.depicts = [depictsRelationTarget.resource.id];
        }

        const georeference: ImageGeoreference = ExtensionUtil.getExtension(fileName).includes('tif')
            ? await getGeoreferenceFromGeotiff(buffer)
            : undefined;
        if (georeference) document.resource.georeference = georeference;

        return await this.relationsManager.update(document);
    }


    private static getFiles(e: Event): Array<File> {

        const event = e as any;

        if (!event) return [];
        let files = [];

        if (event.dataTransfer) {
            if (event.dataTransfer.files) files = event.dataTransfer.files;
        } else if (event.srcElement) {
            if (event.srcElement.files) files = event.srcElement.files;
        }

        return Array.from(files);
    }
}
