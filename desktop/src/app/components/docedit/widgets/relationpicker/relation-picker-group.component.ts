import { AfterViewChecked, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { isEmpty } from 'tsfun';
import { Relation, Resource, Document } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';


/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'relation-picker-group',
    templateUrl: './relation-picker-group.html',
    standalone: false
})
export class RelationPickerGroupComponent implements OnChanges, AfterViewChecked {

    @Input() resource: Resource;
    @Input() relationDefinition: Relation;

    @ViewChild('plusButton') plusButtonElement: ElementRef;

    public relations: any;

    private creating: boolean = false;
    private autoScroll: boolean = false;


    public ngOnChanges() {

        if (this.resource) this.relations = this.resource.relations;
    }


    public async ngAfterViewChecked() {
        
        if (this.autoScroll && this.plusButtonElement) {
            await AngularUtility.refresh();
            this.plusButtonElement.nativeElement.scrollIntoViewIfNeeded(false);
            this.autoScroll = false;
        }
    }


    public onTargetSelected(target: Document) {

        if (this.creating) {
            this.creating = false;
            if (target) this.autoScroll = true;
        }
    }


    public async createRelation() {

        if (!this.relations[this.relationDefinition.name])
            this.relations[this.relationDefinition.name] = [];

        this.relations[this.relationDefinition.name].push('');

        this.creating = true;
    }


    public validateNewest(): boolean {

        const index: number = this.relations[this.relationDefinition.name].length - 1;

        return (this.relations[this.relationDefinition.name][index]
            && this.relations[this.relationDefinition.name][index].length > 0);
    }


    public isPlusButtonAvailable(): boolean {

        return !this.relations[this.relationDefinition.name]
            || isEmpty(this.relations[this.relationDefinition.name])
            || this.validateNewest();
    }
}
