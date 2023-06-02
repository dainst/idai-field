import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { isBoolean } from 'tsfun';
import { FieldDocument, FieldsViewField, FieldsViewGroup, FieldsViewUtil, Labels, validateUrl } from 'idai-field-core';
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


    public isBoolean = (value: any) => isBoolean(value);

    public isUrl = (value: any) => validateUrl(value);


    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels) {}


    public getGroupLabel = (group: FieldsViewGroup) => this.labels.get(group);


    public async jumpToResource(document: FieldDocument) {

        this.onJumpToResource.emit(document);
    }


    public getObjectLabels(objects: any[], field: FieldsViewField): string[] {

        return objects.map(object => this.getObjectLabel(object, field))
            .filter(object => object !== null);
    }


    public getObjectLabel(object: any, field: FieldsViewField): string|null {

        return FieldsViewUtil.getObjectLabel(
            object,
            field,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value),
            this.labels
        );
    }
}
