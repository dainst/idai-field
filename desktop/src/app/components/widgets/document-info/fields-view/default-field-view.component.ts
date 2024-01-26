import { Component, Input } from '@angular/core';
import { isBoolean, isObject, isArray } from 'tsfun';
import { FieldsViewSubfield, FieldsViewUtil, Labels } from 'idai-field-core';
import { DecimalPipe } from '@angular/common';
import { UtilTranslations } from '../../../../util/util-translations';


@Component({
    selector: 'default-field-view',
    templateUrl: './default-field-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class DefaultFieldViewComponent {

    @Input() value: any;
    @Input() field: FieldsViewSubfield;
   

    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels) {}


    public isBoolean = (value: any) => isBoolean(value);

    public isArray = (value: any) => isArray(value) && value.length > 0;

    
    public getValue(value: any): string|null {

        return isObject(value)
            ? this.getObjectLabel(value)
            : value;
    }


    public getObjectLabels(value: any[]): string[] {

        return value.map(object => this.getObjectLabel(object))
            .filter(object => object !== null);
    }


    private getObjectLabel(value: any): string {

        return FieldsViewUtil.getObjectLabel(
            value,
            this.field,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value),
            this.labels
        )
    }
}
