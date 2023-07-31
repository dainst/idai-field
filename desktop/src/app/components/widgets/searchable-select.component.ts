import { ChangeDetectorRef, Component, Input, OnDestroy, Output, ViewChild, EventEmitter,
    OnInit } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ComponentHelpers } from '../component-helpers';
import { AngularUtility } from '../../angular/angular-utility';


@Component({
    selector: 'searchable-select',
    templateUrl: './searchable-select.html'
})
/**
 * @author Thomas Kleinke
 */
export class SearchableSelectComponent implements OnInit, OnDestroy {

    @Input() selectedValue: string;
    @Input() values: string[];
    @Input() getLabel: (value: string) => string;
    @Input() initiallyOpened: boolean = false;
    @Input() disabled: boolean = false;
    @Input() closeOnClear: boolean = false;

    @Output() onValueSelected: EventEmitter<string> = new EventEmitter<string>();
    @Output() onBlur: EventEmitter<void> = new EventEmitter<void>();
    @Output() onScrollToEnd: EventEmitter<void> = new EventEmitter<void>();
    @Output() onSearchTermChanged: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('selectElement', { static: false }) private selectElement: NgSelectComponent;

    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;


    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    async ngOnInit() {
         
        if (this.initiallyOpened) {
            await AngularUtility.refresh();
            this.selectElement.open();
        }
    }


    ngOnDestroy() {
        
        this.stopListeningToScrollEvents();
    }


    public emitChanges() {

        if (!this.selectedValue && this.closeOnClear) this.selectElement.close();
        
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
