import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AngularUtility } from '../../../../angular/angular-utility';
import { Datastore, Valuelist, ValuelistUtil, Labels, Resource, Field } from 'idai-field-core';

@Component({
    selector: 'form-field-checkboxes',
    templateUrl: './checkboxes.html',
    host: {
        '(window:contextmenu)': 'closePopover()'
    },
    standalone: false
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CheckboxesComponent implements OnChanges {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valueInfoPopover: NgbPopover;

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.fieldContainer[this.field.name]
        );
    }


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    public toggleCheckbox(item: string) {

        if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = [];
        if (!this.removeItem(item)) this.fieldContainer[this.field.name].push(item);
        if (this.fieldContainer[this.field.name].length === 0) delete this.fieldContainer[this.field.name];

        this.onChanged.emit();
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }


    public async openPopover(popover: NgbPopover) {

        await AngularUtility.refresh();
        this.valueInfoPopover = popover;
        this.valueInfoPopover.open();
    }


    public closePopover() {

        if (this.valueInfoPopover) this.valueInfoPopover.close();
        this.valueInfoPopover = undefined;
    }


    private removeItem(name: string): boolean {

        const index = this.fieldContainer[this.field.name].indexOf(name, 0);
        if (index !== -1) this.fieldContainer[this.field.name].splice(index, 1);
        return index !== -1;
    }
}
