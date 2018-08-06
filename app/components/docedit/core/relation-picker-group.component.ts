import {Component, Input, OnChanges} from '@angular/core';

/**
 * @author Thomas Kleinke
 */
@Component({
    moduleId: module.id,
    selector: 'relation-picker-group',
    templateUrl: './relation-picker-group.html'
})

export class RelationPickerGroupComponent implements OnChanges {

    @Input() document: any;
    @Input() relationDefinition: any;
    @Input() primary: string;

    public relations: any;
    
    public ngOnChanges() {
        
        if (this.document) this.relations = this.document.resource.relations;
    }
    
    public createRelation() {

        if (!this.relations[this.relationDefinition.name])
            this.relations[this.relationDefinition.name] = [];
    
        this.relations[this.relationDefinition.name].push('')
    }
    
    public validateNewest(): boolean {
    
        const index: number = this.relations[this.relationDefinition.name].length - 1;
    
        return (this.relations[this.relationDefinition.name][index]
            && this.relations[this.relationDefinition.name][index].length > 0);
    }
}