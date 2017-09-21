import {Component, Output, EventEmitter} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ReadDatastore} from 'idai-components-2/datastore';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {SettingsService} from '../settings/settings-service';
import {M} from '../m';
import {UploadModalComponent} from './upload-modal.component';
import {ExtensionUtil} from '../util/extension-util';
import {UploadStatus} from './upload-status';

@Component({
    selector: 'drop-area',
    moduleId: module.id,
    templateUrl: './drop-area.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropAreaComponent {

    @Output() onImagesUploaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onUploadError: EventEmitter<any> = new EventEmitter<any>();

    private dragOverActive = false;
    private static supportedFileTypes: Array<string> = ['jpg', 'jpeg', 'bmp', 'png', 'gif'];

    public constructor(
        private imagestore: Imagestore,
        private datastore: ReadDatastore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private messages: Messages,
        private settingsService: SettingsService,
        private uploadStatus: UploadStatus
    ) {}

    public onDragOver(event) {

        if (this.dragOverActive) return;

        this.dragOverActive = true;
        event.target.classList.add('dragover');
        event.preventDefault();
    }

    public onDragLeave(event) {

        this.dragOverActive = false;
        event.target.classList.remove('dragover');
    }

    public onDrop(event) {

        event.preventDefault();
        this.startUpload(event);
        this.onDragLeave(event);
    }

    public onSelectImages(event) {

        this.startUpload(event);
    }

    private startUpload(event) {

        if (!this.imagestore.getPath()) return this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]);

        const files = DropAreaComponent.getFiles(event);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files, DropAreaComponent.supportedFileTypes);
        if (result[1]) this.messages.add([M.IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS, result[1]]);
        if (result[0] == 0) return;

        let uploadModalRef;
        this.chooseType(files.length)
            .then(type => {
                uploadModalRef = this.modalService.open(UploadModalComponent, { backdrop: 'static', keyboard: false });
                return this.uploadFiles(files, type).then(() => uploadModalRef.close());
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

    private uploadFiles(files: Array<File>, type: IdaiType) {

        if (!files) return;

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setUploadedImages(0);

        const duplicateFilenames: string[] = [];
        let promise: Promise<any> = Promise.resolve();

        for (let file of files) {
            if (!ExtensionUtil.ofUnsupportedExtension(file, DropAreaComponent.supportedFileTypes)) {
                promise = promise.then(() => this.isDuplicateFilename(file.name))
                    .then(isDuplicateFilename => {
                        if (!isDuplicateFilename) {
                            return this.uploadFile(file, type);
                        } else {
                            duplicateFilenames.push(file.name);
                        }
                    }).then(() => this.uploadStatus.setUploadedImages(this.uploadStatus.getUploadedImages() + 1));
            }
        }

        return promise.then(
            () => this.onImagesUploaded.emit(),
            msgWithParams => this.onUploadError.emit(msgWithParams)
        ).then(
            () => {
                if (duplicateFilenames.length == 1) {
                    this.onUploadError.emit([M.IMAGES_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
                } else if (duplicateFilenames.length > 1) {
                    this.onUploadError.emit([M.IMAGES_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
                }
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

    /**
     * Emits <code>onUploadError</code> with {Array<string>>} where the string
     * array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     *
     * @param file
     * @param type
     */
    private uploadFile(file: File, type: IdaiType): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, type)
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

    private createImageDocument(file: File, type: IdaiType): Promise<any> {

        return new Promise((resolve, reject) => {

            let img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                let doc = {
                    resource: {
                        identifier: file.name,
                        type: type.name,
                        filename: file.name,
                        width: img.width,
                        height: img.height,
                        relations: {}
                    }
                };
                this.persistenceManager.persist(doc, this.settingsService.getUsername(), [doc])
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }

    private static getFiles(event) {

        if (!event) return [];
        let files = [];

        if (event.dataTransfer) {
            if (event.dataTransfer.files)
                files = event.dataTransfer.files;
        } else if (event.srcElement) {
            if (event.srcElement.files)
                files = event.srcElement.files;
        }

        return files;
    }
}
