import { Component, Input, OnChanges } from '@angular/core';
import { Category, Field, Labels } from 'idai-field-core';
import { ConfigurationUtil } from '../../components/configuration/configuration-util';


@Component({
    selector: 'configuration-field-drag-element',
    templateUrl: './configuration-field-drag-element.html'
})
/**
* @author Sebastian Cuy
* @author Thomas Kleinke
 */
export class ConfigurationFieldDragElement implements OnChanges {

    @Input() category: Category;
    @Input() field: Field;
    @Input() hidden: boolean;

    public parentField: boolean = false;
    public label: string;

    constructor(private labels: Labels) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.label = this.labels.get(this.field);
        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
    }


    public isCustomField = () => this.field.source === 'custom';
}
