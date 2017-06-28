import {Component, Input, ElementRef, ViewChild, OnChanges} from '@angular/core';
import {ConfigLoader, IdaiType, ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Relations} from 'idai-components-2/core';
import {ResourcesComponent} from './resources.component';


@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent implements OnChanges {

    @Input() isRecordedIn: IdaiFieldDocument;
    @Input() liesWithin: IdaiFieldDocument;

    private typesTreeList: Array<IdaiType>;
    private type: string;
    @ViewChild('p') private popover;

    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private configLoader: ConfigLoader) {}

    ngOnChanges() {

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.initializeTypesTreeList(projectConfiguration);
        });
    }

    public startDocumentCreation(geometryType: string) {

        this.resourcesComponent.createNewDocument(this.type, geometryType, this.createRelations());
    }

    public reset() {

        this.type = undefined;
    }

    private handleClick(event) {

        if (!this.popover) return;

        let target = event.target;
        let inside = false;

        do {
            if (target === this.elementRef.nativeElement
                || target.id === 'new-object-menu'
                || target.id === 'geometry-type-selection') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) {
            this.popover.close();
        }
    }

    private initializeTypesTreeList(projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = [];

        for (let type of projectConfiguration.getTypesTreeList()) {
            if (this.isAllowedType(type, projectConfiguration)) {
                this.typesTreeList.push(type);
            }
        }
    }

    private createRelations(): Relations {

        let relations: Relations = {};

        if (this.isRecordedIn) relations['isRecordedIn'] = [this.isRecordedIn.resource.id];
        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];

        return relations;
    }

    private isAllowedType(type: IdaiType, projectConfiguration: ProjectConfiguration): boolean {

        if (type.name == 'image') return false;

        if (this.liesWithin && !this.isAllowedRelationTargetType(type, this.liesWithin,
                projectConfiguration.getInverseRelations('liesWithin'), projectConfiguration)) return false;
        if (this.isRecordedIn && !this.isAllowedRelationTargetType(type, this.isRecordedIn,
                projectConfiguration.getInverseRelations('isRecordedIn'), projectConfiguration)) return false;

        return true;
    }

    private isAllowedRelationTargetType(type: IdaiType, parent: IdaiFieldDocument, relationName: string,
                               projectConfiguration: ProjectConfiguration): boolean {

        const relationDefinitions: Array<RelationDefinition>
            = projectConfiguration.getRelationDefinitions(parent.resource.type);

        for (let relationDefinition of relationDefinitions) {
            if (relationName == relationDefinition.name
                && relationDefinition.range.indexOf(type.name) > -1) return true;
        }

        return false;
    }

}
