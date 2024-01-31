import { Component, ElementRef, Input } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Datastore } from 'idai-field-core';
import { SearchBarComponent } from '../../widgets/search-bar.component';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { QrCodeScannerModalComponent } from '../../widgets/qr-code-scanner-modal.component';
import { Routing } from '../../../services/routing';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';


@Component({
    selector: 'resources-search-bar',
    templateUrl: './resources-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Danilo Guzzo
 */
export class ResourcesSearchBarComponent extends SearchBarComponent {

    @Input() extendedSearch: boolean;

    public suggestionsVisible: boolean = false;


    constructor(private elementRef: ElementRef,
                private menus: Menus,
                private modalService: NgbModal,        
                private datastore: Datastore,
                private routingService: Routing,
                private messages: Messages) {

        super();
    }


    public getSelectedCategory(): string | undefined {

        return this.categories !== undefined && this.categories.length > 0
            ? this.categories[0]
            : undefined;
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    public isCategorySelected(): boolean {

        return this.categories !== undefined && this.categories.length > 0;
    }


    public handleClick(event: Event) {

        let target: any = event.target;
        let insideFilterMenu: boolean = false;
        let insideSearchBarComponent: boolean = false;

        do {
            if (target.id === 'resources-search-bar-filter-button'
                    || target.id === 'resources-search-bar-filter-menu') {
                insideFilterMenu = true;
            }
            if (target === this.elementRef.nativeElement) insideSearchBarComponent = true;

            target = target.parentNode;
        } while (target);

        if (!insideFilterMenu && this.popover) this.popover.close();
        if (!insideSearchBarComponent) this.hideSuggestions();
    }


    public async openQrCodeScannerModal() {
       
        try {
            this.menus.setContext(MenuContext.MODAL);
            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeScannerModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            const scannedCode: string = await modalRef.result;
            await this.openDocument(scannedCode);
        } catch (closeReason) {
            if (closeReason !== 'cancel') {
                this.messages.add([M.RESOURCES_ERROR_QR_CODE_SCANNING_FAILURE]);
                console.error(closeReason);
            }
        } finally {
            this.menus.setContext(MenuContext.DEFAULT);
        }
    }


    private async openDocument(scannedCode: string) {

        const result: Datastore.FindResult = await this.datastore.find(
            { constraints: { 'scanCode:match': scannedCode } }
        );

        if (result.documents.length > 0) {
            this.routingService.jumpToResource(result.documents[0]);
        } else {
            this.messages.add([M.RESOURCES_ERROR_QR_CODE_RESOURCE_NOT_FOUND]);
        }
    }
}
