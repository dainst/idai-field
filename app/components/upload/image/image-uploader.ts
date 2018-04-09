import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {SettingsService} from '../../../core/settings/settings-service';
import {UploadStatus} from '../upload-status';
import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {PersistenceManager} from '../../../core/persist/persistence-manager';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {UploadResult} from '../upload-result';
import {Uploader} from '../uploader';
import {M} from '../../../m';


@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageUploader extends Uploader {

    public static supportedFileTypes: Array<string> = ['jpg', 'jpeg', 'png'];


    public constructor(
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private settingsService: SettingsService, // TODO remove this dependency. replace by username param. it would be nice to get rid of depencency to settings package altogether
        modalService: NgbModal,
        datastore: DocumentReadDatastore,
        uploadStatus: UploadStatus
    ) {
        super(modalService, datastore, uploadStatus);
    }


    public startUpload(files: Array<File>, uploadResult: UploadResult,
                       depictsRelationTarget?: Document): Promise<UploadResult> {

        if (!this.imagestore.getPath()) {
            return Promise.resolve({
                uploadedFiles: 0,
                messages: [[M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]]
            });
        }

        return super.startUpload(files, uploadResult, depictsRelationTarget);
    }


    protected determineType(fileCount: number, depictsRelationTarget?: Document): Promise<IdaiType> {

        return new Promise((resolve, reject) => {

            const imageType: IdaiType = this.projectConfiguration.getTypesTree()['Image'];
            if ((imageType.children && imageType.children.length > 0) || fileCount >= 100 || depictsRelationTarget) {
                const modal: NgbModalRef
                    = this.modalService.open(ImageTypePickerModalComponent, { backdrop: 'static', keyboard: false });

                modal.result.then(
                    (type: IdaiType) => resolve(type),
                    closeReason => reject());

                modal.componentInstance.fileCount = fileCount;
                modal.componentInstance.depictsRelationTarget = depictsRelationTarget;
            } else {
                resolve(imageType);
            }
        });
    }


    protected uploadFile(file: File, type: IdaiType, depictsRelationTarget?: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, type, depictsRelationTarget)
                        .then(doc => that.imagestore.create(doc.resource.id, reader.result,
                            true))
                        .then(() => resolve())
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_WRITE, file.name]);
                        });
                }
            })(this);
            reader.onerror = () => {
                return (error: any) => {
                    console.error(error);
                    reject([M.UPLOAD_ERROR_FILEREADER, file.name]);
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
                const doc: IdaiFieldImageDocument = {
                    resource: {
                        identifier: this.getIdentifier(file.name),
                        shortDescription: '',
                        type: type.name,
                        originalFilename: file.name,
                        width: img.width,
                        height: img.height,
                        relations: {
                            depicts: [],
                            isRecordedIn: []
                        }
                    }
                };

                if (depictsRelationTarget && depictsRelationTarget.resource.id) {
                    doc.resource.relations['depicts'] = [depictsRelationTarget.resource.id];
                }

                this.persistenceManager.persist(doc, this.settingsService.getUsername(), [doc])
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }


    protected getIdentifier(filename: string): string {

        return filename;
    }
}