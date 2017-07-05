import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {SettingsService} from './settings/settings-service';
import {Document} from 'idai-components-2/core';
import {ConfigLoader, RelationDefinition, ViewDefinition} from 'idai-components-2/configuration';

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
                private configLoader: ConfigLoader) {

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

        this.getViewNameForDocument(document)
            .then(vName => {
                viewName = vName;
                return this.router.navigate(['resources', viewName]);
            }).then(() => {
                this.router.navigate(['resources', viewName, 'edit', 'conflicts', document.resource.id])
            });
    }

    private getViewNameForDocument(document: Document): Promise<string> {

        return this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => {
                let relationDefinitions: Array<RelationDefinition>
                    = projectConfiguration.getRelationDefinitions(document.resource.type);
                let mainTypeName: string;

                for (let relationDefinition of relationDefinitions) {
                    if (relationDefinition.name == 'isRecordedIn') {
                        mainTypeName = relationDefinition.range[0];
                        break;
                    }
                }

                let viewDefinitions: Array<ViewDefinition> = projectConfiguration.getViewsList();
                let viewName: string;

                for (let view of viewDefinitions) {
                    if (view.mainType == mainTypeName) {
                        viewName = view.name;
                        break;
                    }
                }

                return Promise.resolve(viewName);
            }).catch(() => {});
    }

}