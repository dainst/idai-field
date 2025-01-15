import { ChangeDetectorRef, Component, Input, OnDestroy, Output, ViewChild, EventEmitter, OnInit,
    Renderer2, OnChanges } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ComponentHelpers } from '../component-helpers';
import { AngularUtility } from '../../angular/angular-utility';


@Component({
    selector: 'searchable-select',
    templateUrl: './searchable-select.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class SearchableSelectComponent implements OnInit, OnChanges, OnDestroy {

    @Input() selectedValue: string;
    @Input() values: string[];
    @Input() getLabel: (value: string) => string;
    @Input() placeholder: string;
    @Input() customPanelClass: string;
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


    constructor(private changeDetectorRef: ChangeDetectorRef,
                private renderer: Renderer2) {}


    async ngOnInit() {
         
        if (this.initiallyOpened) {
            await AngularUtility.refresh();
            this.selectElement.open();
        }
    }


    ngOnChanges() {

        if (this.values?.length && !this.values.includes(this.selectedValue)) {
            this.selectedValue = '';
        }
    }


    ngOnDestroy() {
        
        this.stopListeningToScrollEvents();
    }


    public async onOpen() {

        this.listenToScrollEvents();
        if (this.customPanelClass) this.addCustomPanelClass();
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


    public async addCustomPanelClass() {

        await AngularUtility.refresh();
        this.renderer.addClass(document.querySelector('.ng-dropdown-panel'), this.customPanelClass);
    }


    private onScroll(event: MouseEvent) {

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
