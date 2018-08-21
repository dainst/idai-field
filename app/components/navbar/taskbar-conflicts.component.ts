import {Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {IndexFacade} from '../../core/datastore/index/index-facade';


@Component({
    moduleId: module.id,
    selector: 'taskbar-conflicts',
    templateUrl: './taskbar-conflicts.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarConflictsComponent {


    private cancelClickListener: Function;

    @ViewChild('popover') private popover: any;

    public conflicts: Array<Document> = [];

    constructor(private routingService: RoutingService,
                private elementRef: ElementRef,
                private renderer: Renderer2,
                private datastore: DocumentReadDatastore,
                private indexFacade: IndexFacade) {

        this.fetchConflicts();
        this.indexFacade.changesNotifications().subscribe(() => this.fetchConflicts());
    }


    public async openConflictResolver(document: Document) {

        if (this.popover.isOpen()) {
            this.popover.close();
        }
        await this.routingService.jumpToConflictResolver(document);
    };


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


    private closePopover() {

        if (this.cancelClickListener) this.cancelClickListener();
        this.cancelClickListener = undefined as any;
        this.popover.close();
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


    private startClickListener(): Function {

        return this.renderer.listen('document', 'click', (event: any) => {
            this.handleClick(event);
        });
    }
}