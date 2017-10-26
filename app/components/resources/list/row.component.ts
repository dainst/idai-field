import {Component, Input } from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PersistenceManager, Validator} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiType} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../../../core/datastore/idai-field-datastore';
import {M} from '../../../m';
import {SettingsService} from '../../../service/settings-service';
import {ResourcesComponent} from '../resources.component';
import {ListComponent} from "./list.component";
import {DocumentReference} from "./document-reference";
import {ViewFacade} from '../view/view-facade';

@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})

/**
 * @author Fabian Z.
 */
export class RowComponent {

    @Input() docRef: DocumentReference;
    @Input() depth: number;
    @Input() typesMap: { [type: string]: IdaiType };

    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private validator: Validator,
        private datastore: IdaiFieldDatastore,
        public resourcesComponent: ResourcesComponent,
        public listComponent: ListComponent,
        public viewFacade: ViewFacade
    ) {  }


    private restoreIdentifier(document: IdaiFieldDocument): Promise<any> {

        return this.datastore.get(document.resource.id, { skip_cache: true })
            .then(
                latestRevision => {
                    document.resource.identifier = latestRevision.resource.identifier;
                }
            )
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }

    public markAsChanged() {
        this.documentEditChangeMonitor.setChanged();
    }

    public save(document: IdaiFieldDocument) {

        if (!this.documentEditChangeMonitor.isChanged()) return;

        this.documentEditChangeMonitor.reset();

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.validator.validate(document)
            .then(() => this.persistenceManager.persist(document, this.settingsService.getUsername(), [oldVersion]))
            .then(() => this.messages.add([M.DOCEDIT_SAVE_SUCCESS]))
            .catch(msgWithParams => {
                this.messages.add(msgWithParams);
                return this.restoreIdentifier(document);
            }).catch(msgWithParams => this.messages.add(msgWithParams));
    }
}