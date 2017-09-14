import {Component, ViewChild, ElementRef, Renderer} from '@angular/core';
import {Router} from '@angular/router';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {SettingsService} from './settings/settings-service';
import {ViewUtility} from './util/view-utility';

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

    @ViewChild('popover') private popover;

    private cancelClickListener: Function;

    constructor(private datastore: IdaiFieldDatastore,
                private settings: SettingsService,
                private router: Router,
                private viewUtility: ViewUtility,
                private elementRef: ElementRef,
                private renderer: Renderer) {

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

    public openConflictResolver(document: Document) {

        let viewName: string;

        this.viewUtility.getViewNameForDocument(document)
            .then(name => {
                viewName = name;
                return this.router.navigate(['resources', viewName]);
            }).then(() => {
            this.router.navigate(['resources', viewName, document.resource.id, 'edit', 'conflicts'])
        });
    }

    private subscribeForChanges(): void {

        this.datastore.documentChangesNotifications().subscribe(() => {
            this.fetchConflicts();
        });
    }

    private fetchConflicts() {

        this.datastore.find({constraints: {'_conflicts': 'KNOWN'}}).then(result => {
            this.conflicts = result;
        });
    }

    private startClickListener(): Function {

        return this.renderer.listenGlobal('document', 'click', event => {
            this.handleClick(event);
        });
    }

    private closePopover() {

        this.popover.close();
        this.cancelClickListener();
        this.cancelClickListener = undefined;
    }

    private handleClick(event) {

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