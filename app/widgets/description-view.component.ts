import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {ProjectConfiguration, FieldDefinition} from 'idai-components-2';


@Component({
    selector: 'description-view',
    moduleId: module.id,
    templateUrl: './description-view.html'
})
/**
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
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


    public getLabel(fieldName: string): string {

        return this.projectConfiguration.getTypesMap()[this.document.resource.type]
            .fields.find((field: FieldDefinition) => field.name == fieldName).label;
    }
}