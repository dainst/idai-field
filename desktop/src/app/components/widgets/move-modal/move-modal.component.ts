import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument, CategoryForm, IndexFacade, Constraint, RelationsManager, ProjectConfiguration,
    Datastore} from 'idai-field-core';
import { Messages } from '../../messages/messages';
import { Loading } from '../loading';
import { MoveUtility } from './move-utility';
import { UtilTranslations } from '../../../util/util-translations';


export interface MoveResult {
    success: boolean;
    newParent?: FieldDocument;
}


@Component({
    selector: 'move-modal',
    templateUrl: './move-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class MoveModalComponent {

    public documents: Array<FieldDocument>;
    public filterOptions: Array<CategoryForm> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;
    public showProjectOption: boolean = false;
    public showInventoryRegisterOption: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private relationsManager: RelationsManager,
                private indexFacade: IndexFacade,
                private messages: Messages,
                private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private loading: Loading,
                private utilTranslations: UtilTranslations) {}


    public isLoading = () => this.loading.isLoading('moveModal');


    public getConstraints = () => {

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.documents, this.indexFacade);
        }

        return this.constraints;
    };


    public initialize(documents: Array<FieldDocument>) {

        this.documents = documents;
        this.showProjectOption = MoveUtility.isProjectOptionAllowed(documents, this.projectConfiguration);
        this.showInventoryRegisterOption = MoveUtility.isInventoryRegisterOptionAllowed(
            documents, this.projectConfiguration
        );
        this.filterOptions = MoveUtility.getAllowedTargetCategories(
            documents, this.projectConfiguration, this.utilTranslations
        );
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.isLoading()) this.activeModal.dismiss('cancel');
    }


    public async moveDocuments(newParent: FieldDocument) {

        if (this.isLoading()) return;
        this.loading.start('moveModal');

        const result: MoveResult = { success: false };

        for (let document of this.documents) {
            try {
                await MoveUtility.moveDocument(
                    document,
                    newParent,
                    this.relationsManager,
                    MoveUtility.getIsRecordedInTargetCategories(this.documents, this.projectConfiguration),
                    this.projectConfiguration,
                    this.datastore
                );
                result.success = true;
                result.newParent = newParent;
            } catch (msgWithParams) {
                console.error(msgWithParams);
                this.messages.add(msgWithParams);
            }
        }

        this.loading.stop('moveModal');
        this.activeModal.close(result);
    }
}
