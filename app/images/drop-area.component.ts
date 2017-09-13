import {Component, Output, EventEmitter} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {SettingsService} from '../settings/settings-service';
import {M} from '../m';

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
    private supportedFileTypes: Array<string> = ['jpg', 'jpeg', 'bmp', 'png', 'gif'];

    public constructor(
        private imagestore: Imagestore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private configLoader: ConfigLoader,
        private messages: Messages,
        private settingsService: SettingsService
    ) {
    }

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

        let files = this.getFiles(event);
        if (files.length == 0) return;

        let unsupportedExts = this.getUnsupportedExts(files);
        if (unsupportedExts.length > 0) {
            this.reportUnsupportedFileTypes(unsupportedExts);
        }
        this.chooseType().then(
            type => this.uploadFiles(files, type)
        );
    }

    private getFiles(event) {

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

    private getUnsupportedExts(files) {

        let unsupportedExts: Array<string> = [];
        for (let file of files) {
            let ext;
            if ((ext = this.ofUnsupportedExtension(file)) != undefined) unsupportedExts.push('"*.' + ext + '"');
        }
        return unsupportedExts;
    }

    private reportUnsupportedFileTypes(unsupportedExts) {

        if (unsupportedExts.length > 0) {
            this.messages.add([M.IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS,unsupportedExts.join(',')]);
        }
    }

    private chooseType(): Promise<IdaiType> {

        return new Promise((resolve, reject) => {
            this.configLoader.getProjectConfiguration().then(projectConfiguration => {

                let imageType: IdaiType = projectConfiguration.getTypesTree()['Image'];
                if (imageType.children && imageType.children.length > 0) {
                    this.modalService.open(ImageTypePickerModalComponent).result.then(
                        (type: IdaiType) => resolve(type),
                        (closeReason) => reject()
                    );
                } else {
                    resolve(imageType);
                }
            })
        });
    }

    private uploadFiles(files: File[], type: IdaiType) {

        if (!files) return;

        let promise: Promise<any> = Promise.resolve();

        for (let file of files) {
            if (!this.ofUnsupportedExtension(file)) {
                promise = promise.then(() => this.uploadFile(file, type));
            }
        }

        promise.then(
            () => this.onImagesUploaded.emit(),
            msgWithParams => this.onUploadError.emit(msgWithParams)
        );
    }

    private ofUnsupportedExtension(file: File) {

        let ext = file.name.split('.').pop();
        if (this.supportedFileTypes.indexOf(ext.toLowerCase()) == -1) return ext;
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
                            reject([M.IMAGES_ERROR_MEDIASTORE_WRITE, file.name]);
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
}
