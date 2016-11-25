import {Component, Input} from "@angular/core";
import {IdaiFieldDocument} from "../model/idai-field-document";

@Component({
    selector: 'document-teaser',
    moduleId: module.id,
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: IdaiFieldDocument;

}