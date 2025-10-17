import { ChangeDetectorRef, Component, Input, OnDestroy, Output, ViewChild, EventEmitter, OnInit,
    Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { NgOption, NgSelectComponent } from '@ng-select/ng-select';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Labels, Valuelist, ValuelistValue } from 'idai-field-core';
import { ComponentHelpers } from '../component-helpers';
import { AngularUtility } from '../../angular/angular-utility';


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

    public options: Array<NgOption> = [];

    public onScrollAndContextMenuListener: any;
    public onResizeListener: any;
    public scrollListenerInitialized: boolean = false;

    public valueInfoPopover: NgbPopover;
    public popoverValue: string;

    public inputFieldClicked: boolean;
    public inputFieldRightClicked: boolean;


    constructor(private changeDetectorRef: ChangeDetectorRef,
                private renderer: Renderer2,
                private labels: Labels) {}


    async ngOnInit() {
         
        if (this.initiallyOpened) {
            await AngularUtility.refresh();
            this.selectElement.open();
        }
    }


    ngOnChanges(changes: SimpleChanges) {

        if (this.values?.length && !this.values.includes(this.selectedValue)) {
            this.selectedValue = '';
        }

        if (changes['values']) this.options = this.buildOptions();
    }


    ngOnDestroy() {
        
        this.stopListeningToScrollAndResizeEvents();
    }


    public hasInfo(valueId: string): boolean {
        
        const value: ValuelistValue = this.valuelist?.values[valueId];
        return value && !!(this.labels.getDescription(value) || value.references?.length);
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

        if (this.onScrollAndContextMenuListener) {
            window.removeEventListener('scroll', this.onScrollAndContextMenuListener, true);
            window.removeEventListener('contextmenu', this.onScrollAndContextMenuListener, true);
            this.onScrollAndContextMenuListener = undefined;
        }

        if (this.onResizeListener) {
            window.removeEventListener('resize', this.onResizeListener, true);
            this.onResizeListener = undefined;
        }
    }


    public async addCustomPanelClass() {

        await AngularUtility.refresh();
        this.renderer.addClass(document.querySelector('.ng-dropdown-panel'), this.customPanelClass);
        this.renderer.addClass(document.querySelector('.ng-dropdown-panel'), 'panel-initialized');
    }


    public async openPopover(popover: NgbPopover, value: string, optionElement?: HTMLElement) {

        if (!this.valuelist || !value) return;

        this.popoverValue = value;

        await AngularUtility.refresh();

        this.valueInfoPopover = popover;
        this.valueInfoPopover.positionTarget = optionElement ?? this.selectElement.element;
        this.valueInfoPopover.open();

        this.inputFieldRightClicked = true;

        this.listenToScrollAndResizeEvents();
    }


    public closePopover() {

        if (this.valueInfoPopover) this.valueInfoPopover.close();
        this.valueInfoPopover = undefined;
    }


    public onClick() {

        // This fixes a bug where the ng-select menu would not open on click after it had been right-clicked once
        if (this.inputFieldRightClicked && !this.inputFieldClicked) {
            this.selectElement.open();
        }
        
        this.inputFieldClicked = true;
    }


    private buildOptions(): Array<NgOption> {

        return this.values.map(value => {
            return {
                value,
                label: this.getLabel(value)
            };
        });
    }


    private listenToScrollAndResizeEvents() {

        this.scrollListenerInitialized = false;

        this.onScrollAndContextMenuListener = this.onScrollAndContextmenu.bind(this);
        window.addEventListener('scroll', this.onScrollAndContextMenuListener, true);
        window.addEventListener('contextmenu', this.onScrollAndContextMenuListener, true);

        this.onResizeListener = this.onResize.bind(this);
        window.addEventListener('resize', this.onResizeListener, true);
    }


    private onScrollAndContextmenu(event: MouseEvent) {

        if (!this.scrollListenerInitialized) {
            this.scrollListenerInitialized = true;
            return;
        }

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'ng-dropdown-panel')
                && !ComponentHelpers.isInside(event.target, target => target.localName === 'configuration-info')) { 
            this.selectElement.close();
            this.changeDetectorRef.detectChanges();
        }

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'configuration-info')) {
            this.closePopover();
        }
    }


    private onResize() {

        this.selectElement.close();
        this.closePopover();
        this.changeDetectorRef.detectChanges();
    }
}
