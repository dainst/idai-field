import { ChangeDetectorRef, Component, Input, OnDestroy, Output, ViewChild, EventEmitter, OnInit,
    Renderer2, OnChanges } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Valuelist } from 'idai-field-core';
import { ComponentHelpers } from '../component-helpers';
import { AngularUtility } from '../../angular/angular-utility';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'searchable-select',
    templateUrl: './searchable-select.html',
    host: {
        '(window:contextmenu)': 'closePopover($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class SearchableSelectComponent implements OnInit, OnChanges, OnDestroy {

    @Input() selectedValue: string;
    @Input() values: string[];
    @Input() getLabel: (value: string) => string;
    @Input() valuelist: Valuelist;
    @Input() placeholder: string;
    @Input() customPanelClass: string;
    @Input() clearable: boolean = true;
    @Input() initiallyOpened: boolean = false;
    @Input() disabled: boolean = false;
    @Input() closeOnClear: boolean = false;

    @Output() onValueSelected: EventEmitter<string> = new EventEmitter<string>();
    @Output() onBlur: EventEmitter<void> = new EventEmitter<void>();
    @Output() onScrollToEnd: EventEmitter<void> = new EventEmitter<void>();
    @Output() onSearchTermChanged: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('selectElement', { static: false }) private selectElement: NgSelectComponent;

    public onScrollListener: any;
    public onResizeListener: any;
    public scrollListenerInitialized: boolean = false;

    public valueInfoPopover: NgbPopover;


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
        
        this.stopListeningToScrollAndResizeEvents();
    }


    public async onOpen() {

        this.listenToScrollAndResizeEvents();
        if (this.customPanelClass) this.addCustomPanelClass();
    }


    public emitChanges() {

        if (!this.selectedValue && this.closeOnClear) this.selectElement.close();
        
        this.onValueSelected.emit(this.selectedValue);
    }

    
    public stopListeningToScrollAndResizeEvents() {

        if (this.onScrollListener) {
            window.removeEventListener('scroll', this.onScrollListener, true);
            this.onScrollListener = undefined;
        }

        if (this.onResizeListener) {
            window.removeEventListener('resize', this.onResizeListener, true);
            this.onResizeListener = undefined;
        }
    }


    public async addCustomPanelClass() {

        await AngularUtility.refresh();
        this.renderer.addClass(document.querySelector('.ng-dropdown-panel'), this.customPanelClass);
    }


    public async openPopover(popover: NgbPopover) {

        if (!this.valuelist || !this.selectedValue) return;

        await AngularUtility.refresh();
        this.valueInfoPopover = popover;
        this.valueInfoPopover.open();
    }


    public closePopover() {

        if (this.valueInfoPopover) this.valueInfoPopover.close();
        this.valueInfoPopover = undefined;
    }


    private listenToScrollAndResizeEvents() {

        this.scrollListenerInitialized = false;

        this.onScrollListener = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);

        this.onResizeListener = this.onResize.bind(this);
        window.addEventListener('resize', this.onResizeListener, true);
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


    private onResize() {

        this.selectElement.close();
        this.changeDetectorRef.detectChanges();
    }
}
