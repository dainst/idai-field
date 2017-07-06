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

        this.checkConflicts();
        settings.syncStatusChanges().subscribe(c => {
            if (c == 'disconnected')
                this.connected = false;
            else if (c == 'connected')
                this.connected = true;
            else if (c == 'changed') this.checkConflicts();
        });
    }

    private checkConflicts(): void {

        this.datastore.findConflicted().then(result => {
            this.conflicts = result;
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
}