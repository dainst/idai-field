import { Component, Input, OnChanges } from '@angular/core';
import { isBoolean, isObject, isArray } from 'tsfun';
import { FieldsViewSubfield, FieldsViewUtil, Labels } from 'idai-field-core';
import { DecimalPipe } from '@angular/common';
import { UtilTranslations } from '../../../../util/util-translations';
import { Settings } from '../../../../services/settings/settings';


@Component({
    selector: 'default-field-view',
    templateUrl: './default-field-view.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DefaultFieldViewComponent implements OnChanges {

    @Input() value: any;
    @Input() field: FieldsViewSubfield;

    public fieldValueLabels: string[];
   

    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels) {}


    public isBoolean = (value: any) => isBoolean(value);

    public isArray = (value: any) => isArray(value) && value.length > 0;


    ngOnChanges() {
        
        this.updateLabels();
    }


    private updateLabels() {

        this.fieldValueLabels = isArray(this.value)
            ? this.value.map(value => this.getObjectLabel(value)).filter(object => object !== null)
            : isObject(this.value)
                ? [this.getObjectLabel(this.value)]
                : [this.value];
    }


    private getObjectLabel(value: any): string {

        return FieldsViewUtil.getObjectLabel(
            value,
            this.field,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            Settings.getLocale(),
            $localize `:@@revisionLabel.timeSuffix:Uhr`,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value),
            this.labels
        )
    }
}
