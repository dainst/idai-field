import { Component, Input, OnChanges, EventEmitter, Output, ViewChild, AfterViewChecked } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
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
export class WorkflowRelationsComponent implements OnChanges, AfterViewChecked {

    @Input() relationTargets: Array<Document>;
    @Output() onRelationTargetSelected: EventEmitter<Document> = new EventEmitter<Document>();

    @ViewChild('dropdownMenu', { static:false, read: NgbDropdown}) dropdownMenu: NgbDropdown;
    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public categoryInfos: Array<RelationTargetCategoryInfo>;


    constructor() {}


    public selectRelationTarget = (relationTarget: Document) => this.onRelationTargetSelected.emit(relationTarget);

    public trackRelationTarget = (_: number, relationTarget: Document) => relationTarget.resource.id;


    async ngOnChanges() {

        if (this.relationTargets) this.categoryInfos = this.buildCategoryInfos();
    }


    ngAfterViewChecked() {
        
        if (this.dropdownMenu?.isOpen() && this.scrollViewport) {
            this.scrollViewport.checkViewportSize();
        }
    }


    public getAdditionalCategoriesCount(): number {

        return this.categoryInfos.slice(2).reduce((result, info) => {
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
