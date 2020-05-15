import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {set} from 'tsfun';
import {Document, FieldDocument} from 'idai-components-2';
import {ProjectCategories} from '../../core/configuration/project-categories';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {SettingsService} from '../../core/settings/settings-service';
import {MoveUtility} from '../../core/resources/move-utility';
import {IndexFacade} from '../../core/datastore/index/index-facade';
import {Category} from '../../core/configuration/model/category';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {Messages} from '../messages/messages';
import {Constraint} from '../../core/datastore/model/constraint';


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

    public document: FieldDocument;
    public filterOptions: Array<Category> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;
    public showProjectOption: boolean = false;

    private isRecordedInTargetCategories: Array<Category>;
    private liesWithinTargetCategories: Array<Category>;


    constructor(public activeModal: NgbActiveModal,
                private projectCategories: ProjectCategories,
                private persistenceManager: PersistenceManager,
                private settingsService: SettingsService,
                private indexFacade: IndexFacade,
                private messages: Messages,
                private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration) {}


    public getConstraints = () => {

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.document, this.indexFacade);
        }

        return this.constraints;
    };


    public initialize(document: FieldDocument) {

        this.document = document;
        this.showProjectOption = this.isProjectOptionAllowed();
        this.isRecordedInTargetCategories = this.getIsRecordedInTargetCategories();
        this.liesWithinTargetCategories = this.getLiesWithinTargetCategories();

        this.filterOptions = set(this.isRecordedInTargetCategories.concat(this.liesWithinTargetCategories));
        if (this.showProjectOption) {
            this.filterOptions = [this.projectConfiguration.getCategoriesMap()['Project']]
                .concat(this.filterOptions);
        }
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async moveDocument(newParent: FieldDocument) {

        try {
            await MoveUtility.moveDocument(
                this.document,
                newParent,
                this.settingsService.getUsername(),
                this.persistenceManager,
                this.isRecordedInTargetCategories
            );
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.activeModal.close();
    }


    private isProjectOptionAllowed(): boolean {

        return this.viewFacade.isInOverview()
            && Document.hasRelations(this.document,'liesWithin');
    }


    private getIsRecordedInTargetCategories(): Array<Category> {

        return this.projectCategories.getAllowedRelationRangeCategories(
            'isRecordedIn', this.document.resource.category
        );
    }


    private getLiesWithinTargetCategories(): Array<Category> {

        return this.projectCategories.getAllowedRelationRangeCategories(
            'liesWithin', this.document.resource.category
        );
    }
}
