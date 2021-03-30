import {Component, Input} from '@angular/core';
import {ValuelistDefinition} from 'idai-field-core';
import {Resource} from 'idai-field-core';
import {ValuelistUtil} from '../../../../../core/util/valuelist-util';


@Component({
    selector: 'outliers',
    templateUrl: './outliers.html'
})

/**
 * @author Thomas Kleinke
 */
export class OutliersComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() valuelist: ValuelistDefinition;


    public getOutliers(): string[]|undefined {

        return ValuelistUtil.getValuesNotIncludedInValuelist(this.resource, this.fieldName, this.valuelist);
    }


    public remove(outlier: string) {

        if (Array.isArray(this.resource[this.fieldName])) {
            this.removeFromArray(outlier);
        } else {
            delete this.resource[this.fieldName];
        }
    }


    private removeFromArray(outlier: string) {

        const index = this.resource[this.fieldName].indexOf(outlier, 0);
        if (index !== -1) this.resource[this.fieldName].splice(index, 1);
        if (this.resource[this.fieldName].length === 0) delete this.resource[this.fieldName];
    }
}
