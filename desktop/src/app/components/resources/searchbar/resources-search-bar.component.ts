import { Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Document, ProjectConfiguration } from 'idai-field-core';
import { SearchBarComponent } from '../../widgets/search-bar.component';
import { QrCodeService } from '../service/qr-code-service';
import { Routing } from '../../../services/routing';
import { ViewFacade } from '../view/view-facade';


@Component({
    selector: 'resources-search-bar',
    templateUrl: './resources-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Danilo Guzzo
 */
export class ResourcesSearchBarComponent extends SearchBarComponent implements OnDestroy {

    @Input() extendedSearch: boolean;

    public suggestionsVisible: boolean = false;
    public visible: boolean = false;

    private populateDocumentsSubscription: Subscription;


    constructor(private elementRef: ElementRef,
                private qrCodeService: QrCodeService,
                private projectConfiguration: ProjectConfiguration,
                private routingService: Routing,
                viewFacade: ViewFacade) {

        super();

        this.populateDocumentsSubscription = viewFacade.populateDocumentsNotifications()
            .subscribe((_) => this.visible = true);
    }


    ngOnDestroy() {
        
        if (this.populateDocumentsSubscription) this.populateDocumentsSubscription.unsubscribe();
    }


    public getSelectedCategory(): string | undefined {

        return this.selectedCategories?.length > 0
            ? this.selectedCategories[0]
            : undefined;
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    public isCategorySelected(): boolean {

        return this.selectedCategories?.length > 0;
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


    public isQrCodeScannerButtonVisible(): boolean {
        
        return this.projectConfiguration.getQrCodeCategories().length > 0;
    }


    public async scanQrCode() {

        const scannedCode: string = await this.qrCodeService.scanCode();
        if (!scannedCode) return;

        const document: Document = await this.qrCodeService.getDocumentFromScannedCode(scannedCode);
        if (document) this.routingService.jumpToResource(document);
    }
}
