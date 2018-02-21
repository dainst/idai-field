import {Component, ElementRef, Renderer2, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {SettingsService} from '../../core/settings/settings-service';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {IndexFacade} from '../../core/datastore/index/index-facade';


@Component({
    moduleId: module.id,
    selector: 'taskbar',
    templateUrl: './taskbar.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarComponent {

    public connected = false;
    public conflicts: Array<Document> = [];

    @ViewChild('popover') private popover: any;

    private cancelClickListener: Function;


    constructor(private datastore: DocumentReadDatastore,
                private indexFacade: IndexFacade,
                private settings: SettingsService,
                private elementRef: ElementRef,
                private renderer: Renderer2,
                private routingService: RoutingService) {

        this.fetchConflicts();

        this.indexFacade.changesNotifications().subscribe(() => this.fetchConflicts());

        settings.syncStatusChanges().subscribe(c => {
            if (c == 'disconnected') {
                this.connected = false;
            } else if (c == 'connected') {
                this.connected = true;
            }
        });
    }


    public openConflictResolver = (document: Document) => this.routingService.jumpToConflictResolver(document);


    public togglePopover() {

        if (this.popover.isOpen()) {
            this.closePopover();
        } else {
            this.popover.open();
            this.cancelClickListener = this.startClickListener();
        }
    }


    private async fetchConflicts() {

        const result = await this.datastore.find({ constraints: { 'conflicts:exist': 'KNOWN' } });
        this.conflicts = result.documents;
    }


    private startClickListener(): Function {

        return this.renderer.listen('document', 'click', (event: any) => {
            this.handleClick(event);
        });
    }


    private closePopover() {

        this.popover.close();
        this.cancelClickListener();
        this.cancelClickListener = undefined as any;
    }


    private handleClick(event: any) {

        let target = event.target;
        let inside = false;

        do {
            if (target === this.elementRef.nativeElement) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.closePopover();
    }
}