import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {Document} from 'idai-components-2';

@Component({
    selector: 'document-teaser',
    templateUrl: './document-teaser.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentTeaserComponent {

    @Input() document: Document;
}
