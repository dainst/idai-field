import {Component, Output, EventEmitter} from "@angular/core";
import {Mediastore} from 'idai-components-2/datastore';
import {M} from "../m";
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageTypePickerModalComponent} from "./image-type-picker-modal.component";

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

    @Output() onImageUploaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onUploadError: EventEmitter<any> = new EventEmitter<any>();

    private dragOverActive = false;
    private supportedFileTypes: Array<string> = ['jpg','bmp','png','gif'];

    public constructor(
        private mediastore: Mediastore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private configLoader: ConfigLoader,
        private messages: Messages
    ) {
    }

    public onDragOver(event) {
        if (!this.dragOverActive) this.reportUnsuportedFileTypes(event);
        this.dragOverActive = true;
        event.preventDefault();
        event.target.classList.add("dragover");
    }

    public onDragLeave(event) {
        this.dragOverActive = false;
        event.target.classList.remove("dragover");
    }

    public onDrop(event) {

        event.preventDefault();
        let files = event.dataTransfer.files;
        this.chooseType().then(type => this.uploadFiles(files, type));
    }

    public onSelectImages(event) {

        this.chooseType().then(
            type => this.uploadFiles(event.srcElement.files, type)
        );
    }

    private reportUnsuportedFileTypes(event) {
        if (!event) return;
        if (!event.dataTransfer) return;
        if (!event.dataTransfer.files) return;

        let unsupportedExts: Array<string> = [];
        for (let file of event.dataTransfer.files) {
            let ext;
            if ((ext=this.ofUnsupportedExtension(file))!=undefined) unsupportedExts.push('"*.'+ext+'"');
        }

        if (unsupportedExts.length > 0) {
            this.messages.addWithParams([M.IMAGES_DROP_AREA_UNSUPPORTED_EXTS,unsupportedExts.join(',')]);
        }
    }

    private chooseType(): Promise<IdaiType> {

        return new Promise((resolve, reject) => {
            this.configLoader.getProjectConfiguration().then( projectConfiguration => {

                let imageType: IdaiType = projectConfiguration.getTypesTree()['image'];
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

        for (let file of files) {
            if (!this.ofUnsupportedExtension(file)) {
                this.uploadFile(file, type);
            }
        }
    }

    private ofUnsupportedExtension(file:File) {
        let ext = file.name.split('.').pop();
        if (this.supportedFileTypes.indexOf(ext) == -1) return ext;
    }

    /**
     * Emits <code>onUploadError</code> with {Array<string>>} where the string
     * array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     *
     * @param file
     * @param type
     */
    private uploadFile(file: File, type: IdaiType) {

        let reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                that.mediastore.create(file.name, reader.result).then(() => {
                    return that.createImageDocument(file, type);
                }).then(() => {
                    that.onImageUploaded.emit();
                }).catch(error => {
                    that.onUploadError.emit([M.IMAGES_ERROR_MEDIASTORE_WRITE, file.name]);
                    console.error(error);
                });
            }
        })(this);
        reader.onerror = (that => {
            return (error) => {
                that.onUploadError.emit([M.IMAGES_ERROR_FILEREADER, file.name]);
                console.error(error);
            }
        })(this);
        reader.readAsArrayBuffer(file);
    }

    private createImageDocument(file: File, type: IdaiType): Promise<any> {

        return new Promise((resolve, reject) => {
            this.configLoader.getProjectConfiguration().then( projectConfiguration => {

                var img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    var doc = {
                        "resource": {
                            "identifier": file.name,
                            "type": type.name,
                            "filename": file.name,
                            "width": img.width,
                            "height": img.height,
                            "relations": {}
                        }
                    };
                    this.persistenceManager.persist(doc, doc)
                        .then(result => resolve(result))
                        .catch(error => reject(error));
                };
            })
        });
    }
}
