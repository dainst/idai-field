import { Component, Input, OnChanges } from '@angular/core';
import { Category, FieldDefinition } from 'idai-field-core';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { Labels } from '../services/labels';


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
    @Input() field: FieldDefinition;
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
