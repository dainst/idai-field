import {Component} from '@angular/core';
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

    constructor(private datastore: IdaiFieldDatastore,
                private settings: SettingsService,
                private router: Router,
                private viewUtility: ViewUtility) {

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
            console.log("changes are there");
            this.fetchConflicts();
        });
    }

    private fetchConflicts() {

        this.datastore.find({constraints: {'_conflicts': 'KNOWN'}}).then(result => {
            console.log("result",result);
            this.conflicts = result;
        });
    }
}