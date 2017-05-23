import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument, IdaiFieldResource} from 'idai-components-2/idai-field-model';


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