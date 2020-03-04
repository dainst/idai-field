import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document, NewImageDocument} from 'idai-components-2';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {UploadModalComponent} from './upload-modal.component';
import {ExtensionUtil} from '../../../core/util/extension-util';
import {UploadStatus} from './upload-status';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {M} from '../../messages/m';
import {IdaiType} from '../../../core/configuration/model/idai-type';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {IdaiFieldFindResult} from '../../../core/datastore/cached/cached-read-datastore';
import {readWldFile} from '../../../core/images/wld/wld-import';

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


    public constructor(
        private imagestore: Imagestore,
        private datastore: DocumentReadDatastore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private usernameProvider: UsernameProvider,
        private uploadStatus: UploadStatus,
        private imageDocumentDatastore: ImageReadDatastore
    ) {}


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
        const supportedFileTypes = ImageUploader.supportedImageFileTypes.concat(ImageUploader.supportedWorldFileTypes);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files, supportedFileTypes);
        if (result[1]) {
            uploadResult.messages.push([
                M.IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS,
                result[1],
                supportedFileTypes.map(extension => '.' + extension).join(', ')
            ]);
        }
        if (result[0] == 0) return uploadResult;

        const imageFiles = files.filter(file =>
            ImageUploader.supportedImageFileTypes.includes(ExtensionUtil.getExtension(file)));
        if (imageFiles.length) {
            const type = await this.chooseType(imageFiles.length, depictsRelationTarget);
            const uploadModalRef = this.modalService.open(UploadModalComponent, { backdrop: 'static', keyboard: false });
            uploadResult = await this.uploadImageFiles(imageFiles, type, uploadResult, depictsRelationTarget);
            uploadModalRef.close();                
        }

        const wldFiles = files.filter(file =>
            ImageUploader.supportedWorldFileTypes.includes(ExtensionUtil.getExtension(file)));
        if (wldFiles.length) {
            uploadResult.messages = uploadResult.messages.concat(await this.uploadWldFiles(wldFiles));
        }
        
        return uploadResult;

    }


    private async chooseType(fileCount: number, depictsRelationTarget?: Document): Promise<IdaiType> {

        const imageType: IdaiType = this.projectConfiguration.getTypesTree()['Image'];
        if ((imageType.children && imageType.children.length > 0) || fileCount >= 100 || depictsRelationTarget) {
            const modal: NgbModalRef
                = this.modalService.open(ImageTypePickerModalComponent, { backdrop: 'static', keyboard: false });

            modal.componentInstance.fileCount = fileCount;
            modal.componentInstance.depictsRelationTarget = depictsRelationTarget;

            return await modal.result;
        } else {
            return imageType;
        }
    }


    private async uploadImageFiles(files: Array<File>, type: IdaiType, uploadResult: ImageUploadResult,
                        depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        if (!files) uploadResult;

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setHandledImages(0);

        const duplicateFilenames: string[] = [];

        for (let file of files) {
            if (ExtensionUtil.ofUnsupportedExtension(file, ImageUploader.supportedImageFileTypes)) {
                this.uploadStatus.setTotalImages(this.uploadStatus.getTotalImages() - 1);
            } else {
                try {
                    await this.findImageByFilename(file.name)
                        .then(result => result.totalCount > 0)
                        .then(isDuplicateFilename => {
                            if (!isDuplicateFilename) {
                                return this.uploadFile(file, type, depictsRelationTarget);
                            } else {
                                duplicateFilenames.push(file.name);
                            }
                        }).then(() => this.uploadStatus.setHandledImages(this.uploadStatus.getHandledImages() + 1));
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
        await this.persistenceManager.persist(document, this.usernameProvider.getUsername());
    }


    private findImageByFilename(filename: string): Promise<IdaiFieldFindResult<Document>> {

        return this.datastore.find({
            constraints: {
                'identifier:match' : filename
            }
        });
    }


    private uploadFile(file: File, type: IdaiType, depictsRelationTarget?: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, type, depictsRelationTarget)
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_UPLOAD, file.name]);
                        })
                        .then(doc => that.imagestore.create(doc.resource.id, reader.result as any, true).then(() =>
                            // to refresh the thumbnail in cache, which is done to prevent a conflict afterwards
                            this.imageDocumentDatastore.get(doc.resource.id, { skipCache: true })
                        ))
                        .then(() =>
                            resolve()
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


    private createImageDocument(file: File, type: IdaiType, depictsRelationTarget?: Document): Promise<any> {

        return new Promise((resolve, reject) => {

            let img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const doc: NewImageDocument = {
                    resource: {
                        identifier: file.name,
                        shortDescription: '',
                        type: type.name,
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

                this.persistenceManager.persist(doc, this.usernameProvider.getUsername())
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