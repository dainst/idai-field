import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Valuelist, ValuelistUtil, Labels, Resource, Field } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';
import { ComponentHelpers } from '../../../component-helpers';


@Component({
    selector: 'form-field-checkboxes',
    templateUrl: './checkboxes.html',
    standalone: false
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CheckboxesComponent implements OnChanges, OnDestroy {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valueInfoPopover: NgbPopover;
    public valuelist: Valuelist;

    private listener: any;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.fieldContainer[this.field.name]
        );
    }


    ngOnDestroy() {

        this.removeListeners();
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
        this.initializeListeners();
    }


    public closePopover() {

        if (this.valueInfoPopover) this.valueInfoPopover.close();
        this.valueInfoPopover = undefined;
        this.removeListeners();
    }


    private removeItem(name: string): boolean {

        const index = this.fieldContainer[this.field.name].indexOf(name, 0);
        if (index !== -1) this.fieldContainer[this.field.name].splice(index, 1);
        return index !== -1;
    }


    private initializeListeners() {

        this.listener = this.onMouseEvent.bind(this);
        window.addEventListener('click', this.listener, true);
        window.addEventListener('scroll', this.listener, true);
        window.addEventListener('contextmenu', this.listener, true);
        window.addEventListener('resize', this.listener, true);
    }


    private removeListeners() {

        if (this.listener) {
            window.removeEventListener('click', this.listener, true);
            window.removeEventListener('scroll', this.listener, true);
            window.removeEventListener('contextmenu', this.listener, true);
            window.removeEventListener('resize', this.listener, true);
            this.listener = undefined;
        }
    }


    private onMouseEvent(event: MouseEvent) {

         if (!ComponentHelpers.isInside(event.target, target => target.localName === 'value-info')) {
            this.closePopover();
         }
    }
}
