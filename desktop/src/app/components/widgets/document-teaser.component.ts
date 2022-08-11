import { Component, Input } from '@angular/core';
import { isString } from 'tsfun';
import { Document, I18N, Labels } from 'idai-field-core';


@Component({
    selector: 'document-teaser',
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: Document;


    constructor(private labels: Labels) {}


    public getShortDescription(): string {

        const shortDescription = this.document.resource.shortDescription;

        return shortDescription
            ? isString(shortDescription)
                ? shortDescription
                : this.labels.getFromI18NString(shortDescription)
            : undefined;
    }
}
