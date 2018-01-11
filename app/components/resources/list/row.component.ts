import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Validator} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {IdaiType} from 'idai-components-2/configuration';
import {M} from '../../../m';
import {SettingsService} from '../../../core/settings/settings-service';
import {ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../view/view-facade';
import {PersistenceManager} from '../../../core/persist/persistence-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';


@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})

/**
 * @author Fabian Z.
 * @autor Thomas Kleinke
 */
export class RowComponent {

    @Input() document: IdaiFieldDocument;
    @Input() typesMap: { [type: string]: IdaiType };

    private initialValueOfCurrentlyEditedField: string|undefined;


    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private validator: Validator,
        private datastore: IdaiFieldDocumentReadDatastore
    ) {  }


    public startEditing(fieldValue: string) {

        this.initialValueOfCurrentlyEditedField = fieldValue;
    }


    public stopEditing(document: IdaiFieldDocument, fieldValue: string) {

        if (this.initialValueOfCurrentlyEditedField != fieldValue) this.save(document);
        this.initialValueOfCurrentlyEditedField = fieldValue;
    }


    public onKeyup(event: KeyboardEvent, document: IdaiFieldDocument, fieldValue: string) {

        if (event.keyCode == 13) { // Return key
            this.stopEditing(document, fieldValue);
        }
    }


    public save(document: IdaiFieldDocument) {

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.validator.validate(document)
            .then(() => this.persistenceManager.persist(document, this.settingsService.getUsername(),
                [oldVersion]))
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


    private restoreIdentifier(document: IdaiFieldDocument): Promise<any> {

        return this.datastore.get(document.resource.id as any, { skip_cache: true })
            .then(
                latestRevision => {
                    document.resource.identifier = latestRevision.resource.identifier;
                }
            )
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }
}