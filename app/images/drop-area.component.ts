import {Component, Output, EventEmitter} from "@angular/core";
import {Datastore} from 'idai-components-2/datastore';
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";
import {Messages} from 'idai-components-2/messages';

@Component({
    selector: 'drop-area',
    moduleId: module.id,
    templateUrl: './drop-area.html'
})

/**
 * @author Sebastian Cuy
 */
export class DropAreaComponent {

    @Output() onImageUploaded: EventEmitter<any> = new EventEmitter<any>();
    
    public constructor(
        private mediastore: Mediastore,
        private datastore: Datastore,
        private messages: Messages
    ) {
    }

    public onDragOver(event) {
        event.preventDefault();
        event.target.classList.add("dragover");
    }

    public onDragLeave(event) {
        event.target.classList.remove("dragover");
    }

    public onDrop(event) {
        event.preventDefault();
        this.uploadFiles(event.dataTransfer.files);
    }

    public onSelectImages(event) {
        this.uploadFiles(event.srcElement.files);
    }

    private uploadFiles(files) {
        if (files && files.length > 0) {
            for (var i=0; i < files.length; i++) this.uploadFile(files[i]);
        }
    }

    private uploadFile(file) {
        var reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                that.mediastore.create(file.name, reader.result).then(() => {
                    return that.createImageDocument(file);
                }).then(() => {
                    that.onImageUploaded.emit();
                }).catch(error => {
                    that.messages.add(M.IMAGES_ERROR_MEDIASTORE_WRITE, [file.name]);
                    console.error(error);
                });
            }
        })(this);
        reader.onerror = (that => {
            return (e) => {
                that.messages.add(M.IMAGES_ERROR_FILEREADER, [file.name]);
                console.error(e.target.error);
            }
        })(this);
        reader.readAsArrayBuffer(file);
    }

    private createImageDocument(file): Promise<any> {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                var doc = {
                    "resource": {
                        "identifier": file.name,
                        "type": "image",
                        "filename": file.name,
                        "width": img.width,
                        "height": img.height
                    }
                };
                this.datastore.create(doc)
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }
}
