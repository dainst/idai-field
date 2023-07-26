import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Datastore, Labels, Field, Valuelist, ValuelistUtil, Hierarchy, Resource } from 'idai-field-core';
import { ComponentHelpers } from '../../../component-helpers';


@Component({
    selector: 'form-field-dropdown',
    templateUrl: './dropdown.html'
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropdownComponent implements OnDestroy, OnChanges {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

    @ViewChild('selectElement', { static: false }) private selectElement: NgSelectComponent;

    public valuelist: Valuelist;

    public onScrollListener: any;


    constructor(private datastore: Datastore,
                private labels: Labels,
                private changeDetectorRef: ChangeDetectorRef) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource)
        );
    }


    ngOnDestroy() {
        
        this.stopListeningToScrollEvents();
    }


    public listenToScrollEvents() {

        this.onScrollListener = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);
    }

    
    public stopListeningToScrollEvents() {

        if (!this.onScrollListener) return;

        window.removeEventListener('scroll', this.onScrollListener, true);
        this.onScrollListener = undefined;
    }


    public deleteIfEmpty() {

        const fieldContent: any = this.fieldContainer[this.field.name];
        
        if (fieldContent === '' || fieldContent === null) {
            delete this.fieldContainer[this.field.name];
        }
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }


    public onScroll(event: MouseEvent) {

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'ng-dropdown-panel')) { 
            this.selectElement.close();
            this.changeDetectorRef.detectChanges();
        }
    }
}
