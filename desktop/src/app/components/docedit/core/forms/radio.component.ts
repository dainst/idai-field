import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Resource, Valuelist, ValuelistUtil, Labels } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';
import { ComponentHelpers } from '../../../component-helpers';


@Component({
    selector: 'form-field-radio',
    templateUrl: './radio.html',
    standalone: false
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RadioComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldContainer: any;
    @Input() field: any;
    
    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valuelist: Valuelist;
    public valueInfoPopover: NgbPopover;

    private listener: any;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.fieldContainer[this.field.name]
        );
    }


    public setValue(value: any) {

        this.fieldContainer[this.field.name] = value;
        this.onChanged.emit();
    }


    public resetValue() {

        delete this.fieldContainer[this.field.name];
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

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'configuration-info')) {
            this.closePopover();
        }
    }
}
