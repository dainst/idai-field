import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldDocument, FieldsViewField, FieldsViewGroup, FieldsViewUtil, Labels } from 'idai-field-core';
import { UtilTranslations } from '../../../util/util-translations';


@Component({
    selector: 'field-view',
    templateUrl: './field-view.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class FieldViewComponent {

    @Input() field: FieldsViewField;
    @Input() showFieldLabel: boolean = true;

    @Output() onJumpToResource = new EventEmitter<FieldDocument>();


    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels) {}


    public getGroupLabel = (group: FieldsViewGroup) => this.labels.get(group);


    public async jumpToResource(document: FieldDocument) {

        this.onJumpToResource.emit(document);
    }

    public getSubfields(field: FieldsViewField, entry: any) {

        return field.subfields.filter(subfield => entry[subfield.name] !== undefined);
    }
}
