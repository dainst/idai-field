import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {Document} from 'idai-components-2/core';
import {SettingsService} from './settings/settings-service';

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
    public conflicts: Document[] = [];

    constructor(private datastore: IdaiFieldDatastore,
                private settings: SettingsService,
                private router: Router) {

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

    public openConflictResolver(resourceId: string) {
        
        this.router.navigate(['resources']).then(
            () => this.router.navigate(['resources', 'edit', 'conflicts', resourceId])
        );
    }

}