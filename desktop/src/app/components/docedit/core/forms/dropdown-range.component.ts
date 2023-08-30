import { Component, Input } from '@angular/core';
import { isUndefinedOrEmpty } from 'tsfun';
import { Datastore, OptionalRange, Resource, Valuelist, ValuelistUtil, Labels, Hierarchy } from 'idai-field-core';


const PROJECT = 'project';


@Component({
    selector: 'form-field-dropdown-range',
    templateUrl: './dropdown-range.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DropdownRangeComponent {

    @Input() resource: Resource;
    @Input() fieldContainer: any;
    @Input() field: any;

    public valuelist: Valuelist;

    private endActivated: boolean = false;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);

    public activateEnd = () => this.endActivated = true;


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get(PROJECT),
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource)
        );
    }


    public showEndElements(): boolean {

        return this.endActivated
            || (this.fieldContainer[this.field.name]
                && !isUndefinedOrEmpty(this.fieldContainer[this.field.name][OptionalRange.ENDVALUE]));
    }


    public setValue(value: string) {

        if (!value) {
            this.endActivated = false;
            delete this.fieldContainer[this.field.name];
        } else {
            if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = {};
            this.fieldContainer[this.field.name][OptionalRange.VALUE] = value;
        }
    }


    public setEndValue(value: string) {

        if (!value) {
            this.endActivated = false;
            delete this.fieldContainer[this.field.name][OptionalRange.ENDVALUE]
        } else {
            this.fieldContainer[this.field.name][OptionalRange.ENDVALUE] = value;
        }
    }
}
