import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {Document} from 'idai-field-core';

@Component({
    selector: 'document-teaser',
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: Document;
}
