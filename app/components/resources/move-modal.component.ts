import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {unique} from 'tsfun';
import {Document, FieldDocument, Constraint, Messages} from 'idai-components-2';
import {TypeUtility} from '../../core/model/type-utility';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {SettingsService} from '../../core/settings/settings-service';
import {MoveUtility} from './move-utility';
import {IndexFacade} from '../../core/datastore/index/index-facade';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';


@Component({
    selector: 'move-modal',
    moduleId: module.id,
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
    public filterOptions: Array<IdaiType> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;
    public showProjectOption: boolean = false;

    private isRecordedInTargetTypes: Array<IdaiType>;
    private liesWithinTargetTypes: Array<IdaiType>;


    constructor(public activeModal: NgbActiveModal,
                private typeUtility: TypeUtility,
                private persistenceManager: PersistenceManager,
                private settingsService: SettingsService,
                private indexFacade: IndexFacade,
                private messages: Messages,
                private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration) {
    }


    public getConstraints = () => {

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.document, this.indexFacade);
        }

        return this.constraints;
    };


    public initialize(document: FieldDocument) {

        this.document = document;
        this.showProjectOption = this.isProjectOptionAllowed();
        this.isRecordedInTargetTypes = this.getIsRecordedInTargetTypes();
        this.liesWithinTargetTypes = this.getLiesWithinTargetTypes();

        this.filterOptions = unique(this.isRecordedInTargetTypes.concat(this.liesWithinTargetTypes));
        if (this.showProjectOption) {
            this.filterOptions = [this.projectConfiguration.getTypesMap()['Project']]
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
                this.isRecordedInTargetTypes
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


    private getIsRecordedInTargetTypes(): Array<IdaiType> {

        return this.typeUtility.getAllowedRelationRangeTypes(
            'isRecordedIn', this.document.resource.type
        );
    }


    private getLiesWithinTargetTypes(): Array<IdaiType> {

        return this.typeUtility.getAllowedRelationRangeTypes(
            'liesWithin', this.document.resource.type
        );
    }
}