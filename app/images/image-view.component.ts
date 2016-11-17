import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {ImageComponentBase} from "./image-component-base";
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent extends ImageComponentBase implements OnInit {

    constructor(
        route: ActivatedRoute,
        datastore: ReadDatastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        super(route,datastore,mediastore,sanitizer,messages);
    }

    ngOnInit() {
        this.fetchDocAndImage();
    }
}
