import { Component, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document, ProjectConfiguration, Relation } from 'idai-field-core';
import { MenuContext } from '../../../../../services/menu-context';
import { Menus } from '../../../../../services/menus';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { WorkflowRelationsModalComponent } from './workflow-relations-modal.component';


type RelationTargetCategoryInfo = { categoryName: string, count: number };


@Component({
    selector: 'workflow-relations',
    templateUrl: './workflow-relations.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowRelationsComponent implements OnChanges {

    @Input() workflowStep: Document;
    @Input() relationName: 'isExecutedOn'|'resultsIn';
    @Input() mandatory: boolean;

    @Output() onChanges: EventEmitter<void> = new EventEmitter<void>();

    public relationTargets: Array<Document>;
    public categoryInfos: Array<RelationTargetCategoryInfo>;


    constructor(private modalService: NgbModal,
                private menuService: Menus,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration) {}


    async ngOnChanges() {

        await this.update();
    }


    public getAdditionalCategoriesCount(): number {

        return this.categoryInfos.slice(3).reduce((result, info) => {
            return result + info.count;
        }, 0);
    }


    public async edit() {

        try {
            this.menuService.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                WorkflowRelationsModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.workflowStep = this.workflowStep;
            modalRef.componentInstance.relationDefinition = this.getRelationDefinition();
            modalRef.componentInstance.mandatory = this.mandatory;
            await modalRef.componentInstance.initialize();
            AngularUtility.blurActiveElement();
            await modalRef.result;
            await this.update();
            this.onChanges.emit();
        } catch (err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            this.menuService.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }


    private async update() {

        this.relationTargets = await this.fetchRelationTargets();
        this.categoryInfos = this.buildCategoryInfos();
    }


    private async fetchRelationTargets(): Promise<Array<Document>> {

        const targetIds: string[] = this.workflowStep.resource.relations[this.relationName];

        return targetIds
            ? this.datastore.getMultiple(targetIds)
            : [];
    }


    private buildCategoryInfos(): Array<RelationTargetCategoryInfo> {

        return this.relationTargets.reduce((result, target) => {
            const categoryName: string = target.resource.category;
            const info: RelationTargetCategoryInfo = result.find(info => info.categoryName === categoryName);
            if (info) {
                info.count++;
            } else {
                result.push({ categoryName, count: 1 });
            }
            return result;
        }, []);
    }


    private getRelationDefinition(): Relation {

        return this.projectConfiguration.getRelationsForDomainCategory(this.workflowStep.resource.category)
            .find(relation => relation.name === this.relationName);
    }
}
