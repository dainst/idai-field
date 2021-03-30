import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, Category, IndexFacade, Constraint} from 'idai-field-core';
import {RelationsManager} from '../../core/model/relations-manager';
import {MoveUtility} from '../../core/resources/move-utility';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {Messages} from '../messages/messages';
import {Loading} from '../widgets/loading';


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
    public filterOptions: Array<Category> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;
    public showProjectOption: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private relationsManager: RelationsManager,
                private indexFacade: IndexFacade,
                private messages: Messages,
                private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {}


    public isLoading = () => this.loading.isLoading('moveModal');


    public getConstraints = () => {

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.documents, this.indexFacade);
        }

        return this.constraints;
    };


    public initialize(documents: Array<FieldDocument>) {

        this.documents = documents;
        this.showProjectOption = MoveUtility.isProjectOptionAllowed(documents, this.viewFacade.isInOverview());
        this.filterOptions = MoveUtility.getAllowedTargetCategories(documents, this.projectConfiguration,
            this.viewFacade.isInOverview());
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.isLoading()) this.activeModal.dismiss('cancel');
    }


    public async moveDocuments(newParent: FieldDocument) {

        if (this.isLoading()) return;
        this.loading.start('moveModal');

        for (let document of this.documents) {
            try {
                await MoveUtility.moveDocument(
                    document,
                    newParent,
                    this.relationsManager,
                    MoveUtility.getIsRecordedInTargetCategories(this.documents, this.projectConfiguration)
                );
            } catch (msgWithParams) {
                console.error(msgWithParams);
                this.messages.add(msgWithParams);
            }
        }

        this.loading.stop('moveModal');
        this.activeModal.close();
    }
}
