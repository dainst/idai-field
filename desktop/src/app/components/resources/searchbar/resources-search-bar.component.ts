import { Component, ElementRef, Input } from '@angular/core';
import { SearchBarComponent } from '../../widgets/search-bar.component';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { QrCodeScannerModalComponent } from '../../widgets/resources-search-modal-qr';
import { Datastore, FieldDocument } from 'idai-field-core';
import { Routing } from '../../../services/routing';

@Component({
    selector: 'resources-search-bar',
    templateUrl: './resources-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
})
/**
 * @author Thomas Kleinke
 * @author Danilo Guzzo
 */
export class ResourcesSearchBarComponent extends SearchBarComponent {
    @Input() extendedSearch: boolean;

    public suggestionsVisible: boolean = false;

    constructor(
        private elementRef: ElementRef,
        private menus: Menus,
        private modalService: NgbModal,        
        private datastore: Datastore,
        private routingService: Routing
    ) {
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
            if (
                target.id === 'resources-search-bar-filter-button' ||
                target.id === 'resources-search-bar-filter-menu'
            ) {
                insideFilterMenu = true;
            }
            if (target === this.elementRef.nativeElement)
                insideSearchBarComponent = true;

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
                { animation: false, backdrop: 'static' }
            );

            const qrCode = await modalRef.result;

            this.openDocument(qrCode);
            
            return true;
        } catch (_) {
            return false;
        } finally {
            this.menus.setContext(MenuContext.DEFAULT);
        }
    }

    // to open the scanned document
    private async openDocument(scannedCode: string) {
        // split the scanned code with an '@'
        console.log(scannedCode);

        const [uuid, projectName] = scannedCode.split('@');
        const document = (await this.datastore.get(uuid) as FieldDocument);

        // open the scanned resource
        this.routingService.jumpToResource(document);
        // close the modal window
        //this.activeModal.close();
    }

}
