import { isUndefinedOrEmpty } from 'tsfun';
import { Document, Resource, Datastore, Relation } from 'idai-field-core';
import { getSuggestions } from './get-suggestions';


/**
 * @author Thomas Kleinke
 */
export class RelationPicker {

    public selectedTarget: Document|undefined;


    constructor(private resource: Resource,
                private relationDefinition: Relation,
                private datastore: Datastore,
                private relationIndex: number) {}


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


    public async leaveSuggestionMode() {

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();
        if (!relationTargetIdentifier || relationTargetIdentifier === '') return this.deleteRelation();

        if (!this.selectedTarget && relationTargetIdentifier && relationTargetIdentifier !== '') {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                console.error(err);
            }
        }
    }


    public getSuggestions(idSearchString: string): Promise<Array<Document>> {

        return getSuggestions(
            this.datastore, this.resource, this.relationDefinition, idSearchString
        );
    }


    private getRelationTargetIdentifier(): string {

        return this.resource.relations[this.relationDefinition.name][this.relationIndex];
    }
}
