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

    private static CHECK_INTERVAL = 2000;

    private connected = false;
    private conflicts: Document[] = [];

    constructor(private datastore: IdaiFieldDatastore,
            private settings: SettingsService) {
        const int = TaskbarComponent.CHECK_INTERVAL;
        Observable.timer(0, int).subscribe(() => this.checkConflicts());
        settings.syncStatusChanges().subscribe(c => {
            this.connected = c;
        });
    }

    private checkConflicts(): void {
        this.datastore.findConflicted().then(result => {
            this.conflicts = result;
        });
    }

}