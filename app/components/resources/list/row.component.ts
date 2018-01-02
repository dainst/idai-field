import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Validator} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiType} from 'idai-components-2/configuration';
import {M} from '../../../m';
import {SettingsService} from '../../../core/settings/settings-service';
import {ResourcesComponent} from '../resources.component';
import {ListComponent} from "./list.component";
import {Node} from "./node";
import {ViewFacade} from '../view/view-facade';
import {IdaiFieldDocumentDatastore} from "../../../core/datastore/idai-field-document-datastore";
import {PersistenceManager} from "../../../core/persist/persistence-manager";
import {FoldState} from "./fold-state";

@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})

/**
 * @author Fabian Z.
 */
export class RowComponent {

    @Input() node: Node;
    @Input() depth: number;
    @Input() typesMap: { [type: string]: IdaiType };


    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private validator: Validator,
        private datastore: IdaiFieldDocumentDatastore,
        public resourcesComponent: ResourcesComponent,
        public listComponent: ListComponent,
        public viewFacade: ViewFacade,
        public foldState: FoldState
    ) {  }


    private restoreIdentifier(document: IdaiFieldDocument): Promise<any> {

        return this.datastore.get(document.resource.id as any, { skip_cache: true })
            .then(
                latestRevision => {
                    document.resource.identifier = latestRevision.resource.identifier;
                }
            )
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }


    public markAsChanged(event: any) {

        if (event.keyCode == 13) {
            this.save(this.node.doc as IdaiFieldDocument);
        } else {
            this.documentEditChangeMonitor.setChanged();
        }
    }


    public save(document: IdaiFieldDocument) {

        if (!this.documentEditChangeMonitor.isChanged()) return;

        this.documentEditChangeMonitor.reset();

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.validator.validate(document)
            .then(() => this.persistenceManager.persist(document, this.settingsService.getUsername(), [oldVersion]))
            .then(() => {
                this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
                // new document 
                if (!oldVersion.resource.id) {
                    this.viewFacade.populateDocumentList();
                }
            })
            .catch(msgWithParams => {
                this.messages.add(msgWithParams);
                return this.restoreIdentifier(document);
            }).catch(msgWithParams => this.messages.add(msgWithParams));
    }
}