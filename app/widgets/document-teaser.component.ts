import {Component, Input} from "@angular/core";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

@Component({
    selector: 'document-teaser',
    moduleId: module.id,
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: IdaiFieldDocument;

}