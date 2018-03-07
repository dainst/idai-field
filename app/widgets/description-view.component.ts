import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ProjectConfiguration} from "idai-components-2/core";


@Component({
    selector: 'description-view',
    moduleId: module.id,
    templateUrl: './description-view.html'
})
/**
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 */
export class DescriptionViewComponent {

    @Input() document: IdaiFieldDocument;

    private typeLabel: string;

    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        if (!this.document) return;
        this.typeLabel = this.projectConfiguration.getLabelForType(
            this.document.resource.type);
    }
}