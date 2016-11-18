import {Component, OnChanges, Input} from "@angular/core";
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Mediastore} from "../datastore/mediastore";
import {ImageTool} from "../images/image-tool";
import {DomSanitizer} from '@angular/platform-browser';


@Component({
    selector: 'thumbnail-view',
    moduleId: module.id,
    templateUrl: './thumbnail-view.html'
})

/**
 * @author Sebastian Cuy
 */
export class ThumbnailViewComponent implements OnChanges {

    private imageTool : ImageTool;

    @Input() document: any;
    
    public images = [];

    constructor(
        private datastore: Datastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        this.imageTool = new ImageTool(datastore,mediastore,sanitizer,messages);
    }

    ngOnChanges() {
        if (!this.document || !this.document.resource.images) {
            this.images = []
        } else {
            Promise.all(this.document.resource.images.map(id => this.imageTool.urlForImage(id)))
                .then(images => this.images = images);
        }
    }
}