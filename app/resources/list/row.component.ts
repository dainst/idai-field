import {Component, Input } from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PersistenceManager, Validator} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';
import {M} from '../../m';
import {SettingsService} from '../../settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ResourcesComponent} from '../resources.component';
import {IdaiType} from 'idai-components-2/configuration';

import {isUndefined} from "util";
import {ListComponent} from "./list.component";

@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})

/**
 * @author Fabian Z.
 */
export class RowComponent {
    @Input() document: IdaiFieldDocument;
    @Input() documents: IdaiFieldDocument[];
    @Input() depth: number;
    @Input() typesMap: { [type: string]: IdaiType };

    private childrenShown : false;

    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private validator: Validator,
        private datastore: IdaiFieldDatastore,
        private resourcesComponent: ResourcesComponent,
        private listComponent: ListComponent
    ) {  }

    private restoreIdentifier(document: IdaiFieldDocument): Promise<any> {
        return this.datastore.getLatestRevision(document.resource.id).then(
            latestRevision => {
                document.resource.identifier = latestRevision.resource.identifier;
            }
        );
    }

    public markAsChanged() {
        this.documentEditChangeMonitor.setChanged();
    }


    public save(document: IdaiFieldDocument) {

        if (!this.documentEditChangeMonitor.isChanged()) return;

        this.documentEditChangeMonitor.reset();

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.validator.validate(document).then(
            () => {
                return this.persistenceManager.persist(document, this.settingsService.getUsername(), [oldVersion]);
            }).then(() => {
            this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
        }).catch(msgWithParams => {
            this.messages.add(msgWithParams);
            return this.restoreIdentifier(document);
        }).catch(msgWithParams => this.messages.add(msgWithParams));
    }
}