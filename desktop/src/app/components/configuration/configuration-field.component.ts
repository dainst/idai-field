import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FieldDefinition, ValuelistDefinition } from 'idai-field-core';
import { ValuelistUtil } from '../../core/util/valuelist-util';

const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


@Component({
    selector: 'configuration-field',
    templateUrl: './configuration-field.html'
})
/**
* @author Sebastian Cuy 
* @author Thomas Kleinke
 */
export class ConfigurationFieldComponent {

    @Input() field: FieldDefinition;
    @Input() hidden: boolean;

    @Output() onToggleHidden: EventEmitter<void> = new EventEmitter();


    constructor() {}


    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public toggleHidden = () => this.onToggleHidden.emit();
}
