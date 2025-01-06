import { Component, Input } from '@angular/core';
import { Dimension, Field, Valuelist, ValuelistUtil } from 'idai-field-core';


@Component({
    selector: 'outliers',
    templateUrl: './outliers.html',
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class OutliersComponent {

    @Input() fieldContainer: any;
    @Input() field: Field;
    @Input() valuelist: Valuelist;


    public getOutliers(): string[]|undefined {

        return ValuelistUtil.getValuesNotIncludedInValuelist(this.fieldContainer[this.field.name], this.valuelist);
    }


    public remove(outlier: string) {

        const fieldContent: any = this.fieldContainer[this.field.name];

        if (Array.isArray(fieldContent)) {
            this.removeFromArray(outlier);
        } else if (fieldContent.endValue === outlier) {
            delete fieldContent.endValue;
        } else {
            delete this.fieldContainer[this.field.name];
        }
    }


    private removeFromArray(outlier: string) {

        if (this.field.inputType === Field.InputType.DIMENSION) {
            this.removeFromDimensionArray(outlier);
        } else {
            this.removeFromStringArray(outlier);
        }
    }


    private removeFromDimensionArray(outlier: string) {

        this.fieldContainer[this.field.name].forEach((dimension: Dimension) => {
            if (dimension.measurementPosition === outlier) delete dimension.measurementPosition;
        });
    }


    private removeFromStringArray(outlier: string) {

        const index = this.fieldContainer[this.field.name].indexOf(outlier, 0);
        if (index !== -1) this.fieldContainer[this.field.name].splice(index, 1);
        if (this.fieldContainer[this.field.name].length === 0) delete this.fieldContainer[this.field.name];
    }
}
