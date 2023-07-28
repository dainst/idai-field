import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { isUndefinedOrEmpty, to } from 'tsfun';
import { Document, Datastore, Resource, Relation } from 'idai-field-core';
import { getSuggestions } from './get-suggestions';


@Component({
    selector: 'relation-picker',
    templateUrl: './relation-picker.html'
})
/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RelationPickerComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() relationDefinition: Relation;
    @Input() relationIndex: number;

    public availableTargets: Array<Document>;
    public selectedTarget: Document|undefined;
    public disabled: boolean = false;


    constructor(private element: ElementRef,
                private datastore: Datastore) {}

    
    public getAvailableTargetIds = () => this.availableTargets?.map(target => target.resource.id);

    public getTargetLabel = (targetId: string) => this.availableTargets
        .find(target => target.resource.id === targetId)?.resource.identifier;


    public async ngOnChanges() {

        try {
            await this.updateSelectedTarget();
        } catch (err) {
            this.disabled = true;
            console.error(err);
        }

        if (!this.selectedTarget) {
            this.availableTargets = await this.fetchAvailableTargets();
        }
    }


    public onTargetSelected(targetId: string) {

        const target: Document = targetId
            ? this.availableTargets.find(t => t.resource.id === targetId)
            : undefined;

        if (target) {
            this.createRelation(target);
        } else {
            this.deleteRelation();
        }
    }


    public onBlur() {

        this.updateSelectedTarget();
        if (!this.selectedTarget) this.deleteRelation();
    }


    public async editTarget() {

        this.selectedTarget = undefined;
        this.availableTargets = await this.fetchAvailableTargets();
    }


    public async updateSelectedTarget(): Promise<void> {

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();

        if (!isUndefinedOrEmpty(relationTargetIdentifier)) {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                return Promise.reject(err);
            }
        } else {
            this.selectedTarget = undefined;
        }
    }


    public createRelation(target: Document) {

        this.resource.relations[this.relationDefinition.name][this.relationIndex] = target.resource.id;
        this.selectedTarget = target;
    }


    public deleteRelation() {

        this.resource.relations[this.relationDefinition.name].splice(this.relationIndex, 1);

        if (this.resource.relations[this.relationDefinition.name].length === 0) {
            delete this.resource.relations[this.relationDefinition.name];
        }
    }


    private getRelationTargetIdentifier(): string {

        return this.resource.relations[this.relationDefinition.name][this.relationIndex];
    }


    private async fetchAvailableTargets(): Promise<Array<Document>> {

        try {
            return await getSuggestions(this.datastore, this.resource, this.relationDefinition);
        } catch (err) {
            console.error(err);
        }
    }
}
