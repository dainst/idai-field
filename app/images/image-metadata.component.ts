import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";


@Component({
    selector: 'image-metadata',
    moduleId: module.id,
    templateUrl: './image-metadata.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ImageMetadataComponent implements OnChanges {

    @Input() doc: any;

    constructor(private router: Router) { }

    ngOnChanges() {

        if (!this.doc) return;
        var resource:IdaiFieldResource = this.doc.resource;
    }

    public selectDocument(documentToJumpTo) {
        console.debug("Jump to related doc ",documentToJumpTo)
    }
}