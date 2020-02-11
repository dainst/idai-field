import {Component, ElementRef, Renderer2, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {Index} from '../../core/datastore/index';
import {NavbarComponent} from './navbar.component';


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

    public conflicts: Array<Document> = [];

    private cancelClickListener: Function;

    @ViewChild('popover', { static: false }) private popover: any;


    constructor(private routingService: RoutingService,
                private elementRef: ElementRef,
                private renderer: Renderer2,
                private datastore: DocumentReadDatastore,
                private indexFacade: Index,
                private navbarComponent: NavbarComponent) {

        this.fetchConflicts();
        this.indexFacade.changesNotifications().subscribe(() => this.fetchConflicts());
    }


    public async openConflictResolver(document: Document) {

        if (this.popover.isOpen()) this.popover.close();

        if (document.resource.type === 'Project') {
            await this.navbarComponent.openProjectsModal(true);
        } else {
            await this.routingService.jumpToConflictResolver(document);
        }
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