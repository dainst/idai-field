import {Component, ElementRef, Renderer, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {SettingsService} from '../../core/settings/settings-service';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {ChangesStream} from '../../core/datastore/core/changes-stream';

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
                private changesStream: ChangesStream,
                private settings: SettingsService,
                private elementRef: ElementRef,
                private renderer: Renderer,
                private routingService: RoutingService) {

        this.fetchConflicts();
        this.subscribeForChanges();

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


    private subscribeForChanges(): void {

        this.changesStream.allChangesAndDeletionsNotifications().subscribe(() => {
            this.fetchConflicts();
        });
    }


    private fetchConflicts() {

        this.datastore.find({ constraints: { 'conflicts:exist': 'KNOWN' } }).then(result => {
            this.conflicts = result.documents;
        });
    }


    private startClickListener(): Function {

        return this.renderer.listenGlobal('document', 'click', (event: any) => {
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