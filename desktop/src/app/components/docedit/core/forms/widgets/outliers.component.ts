import { Component, Input } from '@angular/core';
import { Valuelist, ValuelistUtil } from 'idai-field-core';


@Component({
    selector: 'outliers',
    templateUrl: './outliers.html'
})

/**
 * @author Thomas Kleinke
 */
export class OutliersComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;
    @Input() valuelist: Valuelist;


    public getOutliers(): string[]|undefined {

        return ValuelistUtil.getValuesNotIncludedInValuelist(this.fieldContainer, this.fieldName, this.valuelist);
    }


    public remove(outlier: string) {

        if (Array.isArray(this.fieldContainer[this.fieldName])) {
            this.removeFromArray(outlier);
        } else {
            delete this.fieldContainer[this.fieldName];
        }
    }


    private removeFromArray(outlier: string) {

        const index = this.fieldContainer[this.fieldName].indexOf(outlier, 0);
        if (index !== -1) this.fieldContainer[this.fieldName].splice(index, 1);
        if (this.fieldContainer[this.fieldName].length === 0) delete this.fieldContainer[this.fieldName];
    }
}
