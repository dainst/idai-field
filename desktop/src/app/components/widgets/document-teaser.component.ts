import { Component, Input } from '@angular/core';
import { Document, Labels, ProjectConfiguration, Resource } from 'idai-field-core';


@Component({
    selector: 'document-teaser',
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: Document;


    constructor(private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    public getShortDescription = () => Resource.getShortDescriptionLabel(
        this.document.resource, this.labels, this.projectConfiguration
    );
}
