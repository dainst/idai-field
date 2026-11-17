import { Component, Input, OnChanges } from '@angular/core';
import { CategoryForm, Field, Labels } from 'idai-field-core';
import { ConfigurationUtil } from '../configuration-util';
import { SettingsProvider } from '../../../services/settings/settings-provider';


@Component({
    selector: 'configuration-field-drag-element',
    templateUrl: './configuration-field-drag-element.html',
    standalone: false
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ConfigurationFieldDragElement implements OnChanges {

    @Input() category: CategoryForm;
    @Input() field: Field;
    @Input() hidden: boolean;

    public parentField: boolean = false;
    public label: string;

    constructor(private labels: Labels,
                private settingsProvider: SettingsProvider) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.label = this.labels.get(this.field);
        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
    }


    public highlightAsCustomField = () => this.field.source === 'custom'
        && this.settingsProvider.getSettings().highlightCustomElements;
}
