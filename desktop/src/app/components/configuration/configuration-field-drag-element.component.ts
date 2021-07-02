import { Component, Input, OnChanges } from '@angular/core';
import { flatten, to } from 'tsfun';
import { Category, FieldDefinition, LabelUtil } from 'idai-field-core';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';


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
    

    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.label = LabelUtil.getLabel(this.field);
        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
    }


    public isCustomField = () => this.field.source === 'custom';
}
