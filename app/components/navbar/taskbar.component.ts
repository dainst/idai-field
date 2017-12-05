import {Component, ElementRef, Renderer, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Document} from 'idai-components-2/core';
import {SettingsService} from '../../core/settings/settings-service';
import {ViewFacade} from '../resources/view/view-facade';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {ImageTypeUtility} from '../../common/image-type-utility';

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
                private settings: SettingsService,
                private router: Router,
                private viewFacade: ViewFacade,
                private elementRef: ElementRef,
                private renderer: Renderer,
                private routingService: RoutingService,
                private imageTypeUtility: ImageTypeUtility
    ) {

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


    public togglePopover() {

        if (this.popover.isOpen()) {
            this.closePopover();
        } else {
            this.popover.open();
            this.cancelClickListener = this.startClickListener();
        }
    }


    public openConflictResolver(document: Document) { // TODO move to routing helper

        if (this.imageTypeUtility.isImageType(document.resource.type)) {
            return this.router.navigate(['images', document.resource.id, 'edit', 'conflicts']);
        }

        this.routingService.getMainTypeNameForDocument(document).then(mainTypeName =>
            this.viewFacade.getMainTypeHomeViewName(mainTypeName)
        ).then(viewName => {
            this.router.navigate(['resources', viewName, document.resource.id, 'edit', 'conflicts']);
        });
    }


    private subscribeForChanges(): void {

        this.datastore.allChangesAndDeletionsNotifications().subscribe(() => {
            this.fetchConflicts();
        });
    }


    private fetchConflicts() {

        this.datastore.find({ constraints: { '_conflicts': 'KNOWN' } }).then(result => {
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