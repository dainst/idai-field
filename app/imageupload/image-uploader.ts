import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration';
import {ReadDatastore} from 'idai-components-2/datastore';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {SettingsService} from '../settings/settings-service';
import {M} from '../m';
import {UploadModalComponent} from './upload-modal.component';
import {ExtensionUtil} from '../util/extension-util';
import {UploadStatus} from './upload-status';

export interface ImageUploadResult {

    uploadedImages: number;
    messages: Array<Array<string>>;
}

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageUploader {

    private static supportedFileTypes: Array<string> = ['jpg', 'jpeg', 'png'];


    public constructor(
        private imagestore: Imagestore,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private settingsService: SettingsService, // TODO remove this dependency. replace by username param. it would be nice to get rid of depencency to settings package altogether
        private uploadStatus: UploadStatus
    ) {}


    /**
     * @param event The event containing the images to upload (can be drag event or event from file input element)
     * @param depictsRelationTargetId If this parameter is set, each of the newly created image documents will contain
     *  a depicts relation to the resource specified by the id.
     */
    public startUpload(event: Event, depictsRelationTargetId?: string): Promise<ImageUploadResult> {

        const uploadResult: ImageUploadResult = { uploadedImages: 0, messages: [] };

        if (!this.imagestore.getPath()) {
            uploadResult.messages.push([M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]);
            return Promise.resolve(uploadResult);
        }

        const files = ImageUploader.getFiles(event);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files, ImageUploader.supportedFileTypes);
        if (result[1]) uploadResult.messages.push([M.IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS, result[1]]);
        if (result[0] == 0) return Promise.resolve(uploadResult);

        let uploadModalRef;
        return this.chooseType(files.length)
            .then(type => {
                uploadModalRef = this.modalService.open(UploadModalComponent, { backdrop: 'static', keyboard: false });
                return this.uploadFiles(files, type, uploadResult, depictsRelationTargetId).then(result => {
                    uploadModalRef.close();
                    return Promise.resolve(result);
                });
            }).catch(() => {});
    }


    private chooseType(fileCount: number): Promise<IdaiType> {

        return new Promise((resolve, reject) => {

            const imageType: IdaiType = this.projectConfiguration.getTypesTree()['Image'];
            if ((imageType.children && imageType.children.length > 0) || fileCount >= 100) {
                const modal: NgbModalRef
                    = this.modalService.open(ImageTypePickerModalComponent, { backdrop: 'static', keyboard: false });

                modal.result.then(
                    (type: IdaiType) => resolve(type),
                    closeReason => reject());

                modal.componentInstance.fileCount = fileCount;
            } else {
                resolve(imageType);
            }
        });
    }


    private uploadFiles(files: Array<File>, type: IdaiType, uploadResult: ImageUploadResult,
                        depictsRelationTargetId?: string): Promise<ImageUploadResult> {

        if (!files) return Promise.resolve(uploadResult);

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setHandledImages(0);

        const duplicateFilenames: string[] = [];
        let promise: Promise<any> = Promise.resolve();

        for (let file of files) {
            if (ExtensionUtil.ofUnsupportedExtension(file, ImageUploader.supportedFileTypes)) {
                this.uploadStatus.setTotalImages(this.uploadStatus.getTotalImages() - 1);
            } else {
                promise = promise.then(() => this.isDuplicateFilename(file.name))
                    .then(isDuplicateFilename => {
                        if (!isDuplicateFilename) {
                            return this.uploadFile(file, type, depictsRelationTargetId);
                        } else {
                            duplicateFilenames.push(file.name);
                        }
                    }).then(() => this.uploadStatus.setHandledImages(this.uploadStatus.getHandledImages() + 1));
            }
        }

        return promise.then(
            () => {
                uploadResult.uploadedImages = this.uploadStatus.getHandledImages() - duplicateFilenames.length;
            }, msgWithParams => {
                uploadResult.messages.push(msgWithParams);
            }
        ).then(
            () => {
                if (duplicateFilenames.length == 1) {
                    uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
                } else if (duplicateFilenames.length > 1) {
                    uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
                }

                return Promise.resolve(uploadResult);
            }
        )
    }


    private isDuplicateFilename(filename: string): Promise<boolean> {

        return this.datastore.find({
            constraints: {
                'resource.identifier' : filename
            }
        }).then(result => result && result.length > 0);
    }


    private uploadFile(file: File, type: IdaiType, depictsRelationTargetId?: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, type, depictsRelationTargetId)
                        .then(doc => that.imagestore.create(doc.resource.id, reader.result, true))
                        .then(() => resolve())
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_WRITE, file.name]);
                        });
                }
            })(this);
            reader.onerror = () => {
                return (error) => {
                    console.error(error);
                    reject([M.IMAGES_ERROR_FILEREADER, file.name]);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }


    private createImageDocument(file: File, type: IdaiType, depictsRelationTargetId?: string): Promise<any> {

        return new Promise((resolve, reject) => {

            let img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const doc = {
                    resource: {
                        identifier: file.name,
                        type: type.name,
                        originalFilename: file.name,
                        width: img.width,
                        height: img.height,
                        relations: {}
                    }
                };

                if (depictsRelationTargetId) doc.resource.relations['depicts'] = [depictsRelationTargetId];

                this.persistenceManager.persist(doc, this.settingsService.getUsername(), [doc])
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }


    private static getFiles(event: Event) {

        if (!event) return [];
        let files = [];

        if (event['dataTransfer']) {
            if (event['dataTransfer']['files']) files = event['dataTransfer']['files'];
        } else if (event['srcElement']) {
            if (event['srcElement']['files']) files = event['srcElement']['files'];
        }

        return files;
    }
}