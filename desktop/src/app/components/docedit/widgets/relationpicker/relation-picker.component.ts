import { Component, Input, OnChanges } from '@angular/core';
import { isUndefinedOrEmpty } from 'tsfun';
import { Document, Datastore, Resource, Relation, Labels, ProjectConfiguration } from 'idai-field-core';
import { getSuggestions } from './get-suggestions';


const SUGGESTIONS_CHUNK_SIZE: number = 20;


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

    private searchTerm: string = '';
    private offset: number = 0;


    constructor(private datastore: Datastore,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}

    
    public getAvailableTargetIds = () => this.availableTargets?.map(target => target.resource.id);


    public async ngOnChanges() {

        try {
            await this.updateSelectedTarget();
        } catch (err) {
            this.disabled = true;
            console.error(err);
        }

        this.searchTerm = '';
        this.offset = 0;

        if (!this.selectedTarget) await this.loadNextChunk();
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


    public getTargetLabel = (targetId: string): string => {

        const target: Document = this.availableTargets.find(target => target.resource.id === targetId);
        let label: string = target?.resource.identifier;

        if (target?.resource.shortDescription) {
            const shortDescriptionLabel: string = Resource.getShortDescriptionLabel(
                target.resource, this.labels, this.projectConfiguration
            );
            label += ' (' + shortDescriptionLabel + ')';
        }

        return label;
    }


    public async search(term: string) {

        this.availableTargets = [];
        this.offset = 0;
        this.searchTerm = term;

        await this.loadNextChunk();
    }


    public async loadNextChunk() {

        const newTargets: Array<Document> = await this.fetchAvailableTargets();

        if (!this.availableTargets) this.availableTargets = [];
        this.availableTargets = this.availableTargets.concat(newTargets);

        this.offset += SUGGESTIONS_CHUNK_SIZE;
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
            return await getSuggestions(
                this.datastore, this.resource, this.relationDefinition, this.searchTerm, this.offset,
                SUGGESTIONS_CHUNK_SIZE
            );
        } catch (err) {
            console.error(err);
        }
    }
}
