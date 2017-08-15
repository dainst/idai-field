import {Component, OnInit, Inject} from '@angular/core';
import {Router, Event, NavigationStart} from '@angular/router';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {AppConfigurator} from 'idai-components-2/idai-field-model';
import {SettingsService} from './settings/settings-service';
import {AutoConflictResolvingWorker} from './conflicts/auto-conflict-resolving-worker';
import {M} from './m';

const remote = require('electron').remote;

@Component({
    moduleId: module.id,
    selector: 'idai-field-app',
    templateUrl: './app.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppComponent implements OnInit {

    private static PROJECT_CONFIGURATION_PATH = remote.getGlobal('configurationPath');

    constructor(@Inject('app.config') private config,
                private appConfigurator: AppConfigurator,
                private configLoader: ConfigLoader,
                private router: Router,
                private messages: Messages,
                private settingsService: SettingsService,
                private autoConflictResolvingWorker: AutoConflictResolvingWorker) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add(['some']); }
        //
        router.events.subscribe((event: Event) => {
            if(event instanceof NavigationStart) {
                this.messages.clear();
            }
        });

        AppComponent.preventDefaultDragAndDropBehavior();

        this.settingsService.init();
    }

    ngOnInit() {

        this.appConfigurator.go(AppComponent.PROJECT_CONFIGURATION_PATH);

        this.configLoader.getProjectConfiguration().then(
            projectConfiguration => {
                if (!projectConfiguration.getProjectIdentifier()) {
                    this.messages.add([M.APP_NO_PROJECT_IDENTIFIER]);
                }
            }
        ).catch(msgsWithParams => {
            let count = msgsWithParams.length;
            msgsWithParams.forEach(msg => this.messages.add(msg));
            if (count > 1) this.messages.add([M.APP_ERRORS_IN_CONFIG, count]);
        });

        this.autoConflictResolvingWorker.initialize();
    }

    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}
