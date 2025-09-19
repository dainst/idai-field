import { Component, Input, OnChanges } from '@angular/core';
import { clone, Map } from 'tsfun';
import { Labels, Valuelist } from 'idai-field-core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AngularUtility } from '../../../angular/angular-utility';
import { ComponentHelpers } from '../../component-helpers';


@Component({
    selector: 'valuelist-view',
    templateUrl: './valuelist-view.html',
    standalone: false
})
/**
 *  @author Sebastian Cuy
 *  @author Thomas Kleinke
 */
export class ValuelistViewComponent implements OnChanges {

    @Input() valuelist: Valuelist;
    @Input() showDescription: boolean = true;
    @Input() largeList: boolean;

    public valueLabels: Map<string> = {};
    public valueDescriptions: Map<string> = {};
    public valueInfoPopover: NgbPopover;

    private listener: any;


    constructor(private labels: Labels) {}


    ngOnChanges() {
        
        Object.keys(this.valuelist.values).forEach(valueId => {
            const { label, description } = this.getLabelAndDescription(valueId);
            this.valueLabels[valueId] = label;
            this.valueDescriptions[valueId] = description;
        });
    }
    

    public getValuelistDescription = (valuelist: Valuelist) => this.labels.getDescription(valuelist);

    public getValueIds = (valuelist: Valuelist) => this.labels.orderKeysByLabels(valuelist);


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


    private getLabelAndDescription(valueId: string): { label: string, description?: string } {

        const value: any = clone(this.valuelist.values[valueId]);
        value.name = valueId;

        return this.labels.getLabelAndDescription(value);
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
