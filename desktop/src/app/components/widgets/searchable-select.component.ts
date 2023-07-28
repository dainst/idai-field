import { ChangeDetectorRef, Component, Input, OnDestroy, Output, ViewChild,
    EventEmitter } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ComponentHelpers } from '../component-helpers';


@Component({
    selector: 'searchable-select',
    templateUrl: './searchable-select.html'
})
/**
 * @author Thomas Kleinke
 */
export class SearchableSelectComponent implements OnDestroy {

    @Input() selectedValue: string;
    @Input() values: string[];
    @Input() getLabel: (value: string) => string;

    @Output() onValueSelected: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('selectElement', { static: false }) private selectElement: NgSelectComponent;

    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;


    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    ngOnDestroy() {
        
        this.stopListeningToScrollEvents();
    }

    
    public onChange() {

        this.onValueSelected.emit(this.selectedValue);
    }


    public listenToScrollEvents() {

        this.scrollListenerInitialized = false;

        this.onScrollListener = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);
    }

    
    public stopListeningToScrollEvents() {

        if (!this.onScrollListener) return;

        window.removeEventListener('scroll', this.onScrollListener, true);
        this.onScrollListener = undefined;
    }


    public onScroll(event: MouseEvent) {

        if (!this.scrollListenerInitialized) {
            this.scrollListenerInitialized = true;
            return;
        }

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'ng-dropdown-panel')) { 
            this.selectElement.close();
            this.changeDetectorRef.detectChanges();
        }
    }
}
