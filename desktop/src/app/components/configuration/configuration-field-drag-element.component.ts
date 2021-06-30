import { Component, Input, OnChanges } from '@angular/core';
import { flatten, to } from 'tsfun';
import { Category, FieldDefinition, LabelUtil } from 'idai-field-core';


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
        this.parentField = this.isParentField();
    }


    public isCustomField = () => this.field.source === 'custom';


    // TODO Move to util
    private isParentField(): boolean {

        if (!this.category.parentCategory) return false;

        return flatten(this.category.parentCategory.groups.map(to('fields')))
            .map(to('name'))
            .includes(this.field.name);
    }
}
