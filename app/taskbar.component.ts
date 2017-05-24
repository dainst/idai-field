import {Component} from "@angular/core";
import {IdaiFieldDatastore} from "./datastore/idai-field-datastore";
import {Document} from "idai-components-2/core";
import {Observable} from "rxjs/Rx";
import {SettingsService} from "./settings/settings-service";

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

    private connected = false;
    private conflicts: Document[] = [];

    constructor(private datastore: IdaiFieldDatastore,
            private settings: SettingsService) {
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

}