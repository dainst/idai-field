import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldResource} from "../model/idai-field-resource";


@Component({
    selector: 'description-view',
    moduleId: module.id,
    templateUrl: './description-view.html'
})

/**
 * @author Jan G. Wieners
 */
export class DescriptionViewComponent implements OnChanges {

    @Input() document: IdaiFieldDocument;

    constructor(
        private router: Router
    ) { }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }
}