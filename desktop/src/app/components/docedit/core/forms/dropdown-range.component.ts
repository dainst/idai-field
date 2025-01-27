import { Component, Input } from '@angular/core';
import { isUndefinedOrEmpty, isDefined } from 'tsfun';
import { Datastore, OptionalRange, Resource, Valuelist, ValuelistUtil, Labels, Hierarchy,
    ProjectConfiguration } from 'idai-field-core';


const PROJECT = 'project';


@Component({
    selector: 'form-field-dropdown-range',
    templateUrl: './dropdown-range.html',
    standalone: false
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
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);

    public activateEnd = () => this.endActivated = true;


    async ngOnChanges() {

        this.valuelist = await this.getValuelist();
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


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }


    private async getValuelist(): Promise<Valuelist> {

        const existingValues: string[] = [
            this.fieldContainer[this.field.name]?.[OptionalRange.VALUE],
            this.fieldContainer[this.field.name]?.[OptionalRange.ENDVALUE]
        ].filter(isDefined)

        return ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get(PROJECT),
            this.projectConfiguration,
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource),
            existingValues
        );
    }
}
