import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { isArray } from 'tsfun';
import { Document, Datastore, NewImageDocument, ProjectConfiguration, RelationsManager, 
    ImageStore, ImageGeoreference, ImageDocument, CategoryForm, formatDate } from 'idai-field-core';
import { readWldFile } from '../georeference/wld-import';
import { ExtensionUtil } from '../../../util/extension-util';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { M } from '../../messages/m';
import { ImageUploadMetadataModalComponent } from './image-upload-metadata-modal.component';
import { UploadModalComponent } from './upload-modal.component';
import { UploadStatus } from './upload-status';
import { ImageManipulationErrors } from '../../../services/imagestore/image-manipulation';
import { ImageMetadata, extendMetadataByFileData } from '../../../services/imagestore/file-metadata';
import { getGeoreferenceFromGeotiff } from '../georeference/geotiff-import';
import { createDisplayVariant } from '../../../services/imagestore/create-display-variant';
import { ImagesState } from '../overview/view/images-state';


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


    public constructor(private imagesState: ImagesState,
                       private imagestore: ImageStore,
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
            const metadata: ImageMetadata|undefined = await this.selectMetadata(imageFiles.length, depictsRelationTarget);
            if (!metadata) return uploadResult;

            this.menuService.setContext(MenuContext.MODAL);
            const uploadModalRef = this.modalService.open(
                UploadModalComponent, { backdrop: 'static', keyboard: false, animation: false }
            );
            uploadResult = await this.uploadImageFiles(
                imageFiles, metadata, uploadResult, depictsRelationTarget
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


    private async selectMetadata(fileCount: number,
                                 depictsRelationTarget?: Document): Promise<ImageMetadata|undefined> {

        this.projectConfiguration.getCategory('Image');

        this.menuService.setContext(MenuContext.MODAL);
        const modal: NgbModalRef = this.modalService.open(
            ImageUploadMetadataModalComponent, { backdrop: 'static', keyboard: false, animation: false }
        );

        modal.componentInstance.fileCount = fileCount;
        modal.componentInstance.depictsRelationTarget = depictsRelationTarget;

        try {
            return await modal.result;
        } catch (err) {
            return undefined;
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    private async uploadImageFiles(files: Array<File>, metadata: ImageMetadata, uploadResult: ImageUploadResult,
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
                        await this.uploadFile(file, metadata, depictsRelationTarget);
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


    private async uploadFile(file: File, metadata: ImageMetadata, depictsRelationTarget?: Document): Promise<any> {

        const buffer: Buffer = await this.readFile(file);
        
        let document: ImageDocument;
        
        try {
            document = await this.createImageDocument(file.name, buffer, metadata, depictsRelationTarget);
        } catch (err) {
            if (isArray(err) && err[0] === ImageManipulationErrors.MAX_INPUT_PIXELS_EXCEEDED) {
                throw [M.IMAGESTORE_ERROR_UPLOAD_PIXEL_LIMIT_EXCEEDED, file.name, err[1]];
            } else {
                console.error(err);
                throw [M.IMAGESTORE_ERROR_UPLOAD, file.name];
            }
        }

        try {
            await this.imagestore.store(document.resource.id, buffer);
            await this.imagestore.createThumbnail(document.resource.id, buffer);
            await createDisplayVariant(document, this.imagestore, buffer);
        } catch (err) {
            console.error(err);
            throw [M.IMAGESTORE_ERROR_WRITE, file.name];
        }
    }


    private async readFile(file: File): Promise<Buffer> {

        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = (() => {
                const buffer: Buffer = Buffer.from(reader.result);
                resolve(buffer);
            });

            reader.onerror = () => {
                return (error: any) => {
                    console.error(error);
                    reject([M.IMAGES_ERROR_FILEREADER, file.name]);
                };
            };

            reader.readAsArrayBuffer(file);
        });
    }


    private async createImageDocument(fileName: string, buffer: Buffer, metadata: ImageMetadata,
                                      depictsRelationTarget?: Document): Promise<any> {
                                        
        // Try to extend metadata set explicitely by the user with metadata contained within the image file
        // itself (exif/xmp/iptc).
        const extendedMetadata: ImageMetadata = await extendMetadataByFileData(
            metadata, buffer, this.imagesState.getParseFileMetadata()
        );

        const document: NewImageDocument = {
            resource: {
                identifier: fileName,
                category: extendedMetadata.category,
                originalFilename: fileName,
                width: extendedMetadata.width,
                height: extendedMetadata.height,
                relations: {
                    depicts: []
                }
            }
        };

        await this.setOptionalMetadata(document, extendedMetadata);

        if (depictsRelationTarget && depictsRelationTarget.resource.id) {
            document.resource.relations.depicts = [depictsRelationTarget.resource.id];
        }

        const georeference: ImageGeoreference = ExtensionUtil.getExtension(fileName).includes('tif')
            ? await getGeoreferenceFromGeotiff(buffer)
            : undefined;
        if (georeference) document.resource.georeference = georeference;

        return await this.relationsManager.update(document);
    }


    private async setOptionalMetadata(document: NewImageDocument, extendedMetadata: ImageMetadata) {

        const category: CategoryForm = this.projectConfiguration.getCategory(extendedMetadata.category);
        const staff: string[] = await this.getStaff();

        if (CategoryForm.getField(category, 'date') && extendedMetadata.date) {
            document.resource.date = formatDate(extendedMetadata.date);
        }
        if (CategoryForm.getField(category, 'draughtsmen')) {
            const filteredDraughtsmen: string[] = extendedMetadata.draughtsmen?.filter(value => staff.includes(value));
            if (filteredDraughtsmen?.length) document.resource.draughtsmen = filteredDraughtsmen;
        }
    }


    private async getStaff(): Promise<string[]> {

        const projectDocument: Document = await this.datastore.get('project');
        const staff: string[] = projectDocument.resource.staff;
        return isArray(staff) ? staff: [];
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
