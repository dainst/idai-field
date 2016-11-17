import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {ImageBase} from "./image-base";
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
    moduleId: module.id,
    templateUrl: './image-edit-navigation.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageEditNavigationComponent extends ImageBase implements OnInit {

    constructor(
        private router: Router,
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

    public onSaveSuccess(e) {
        console.debug("on save success",e)
    }

    public onBackButtonClicked() {
        this.router.navigate(['images',this.doc.resource.id,'show']);
    }
}
