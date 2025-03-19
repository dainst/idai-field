import { Component, Input, OnChanges } from '@angular/core';
import { Document } from 'idai-field-core';


type RelationTargetCategoryInfo = { categoryName: string, count: number };


@Component({
    selector: 'workflow-relations',
    templateUrl: './workflow-relations.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowRelations implements OnChanges {

    @Input() workflowStep: Document;
    @Input() relationName: 'isExecutedOn'|'produces';
    @Input() relationTargets: Array<Document>;

    public categoryInfos: Array<RelationTargetCategoryInfo>;


    constructor() {}


    ngOnChanges() {

        this.categoryInfos = this.buildCategoryInfos();
    }


    public getAdditionalCategoriesCount(): number {

        return this.categoryInfos.slice(3).reduce((result, info) => {
            return result + info.count;
        }, 0);
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
}
