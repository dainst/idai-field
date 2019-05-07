import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Document, Resource, ReadDatastore, ProjectConfiguration, FieldDocument} from 'idai-components-2';
import {SidebarListComponent} from './sidebar-list.component';
import {ResourcesComponent} from '../../resources.component';
import {RoutingService} from '../../../routing-service';


@Component({
    selector: 'relations-view',
    moduleId: module.id,
    templateUrl: './relations-view.html'
})
/**
 * Shows relations and fields of a document.
 *
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class RelationsViewComponent implements OnChanges {

    public relations: Array<any>;
    public relationsCount: number = 0;

    @Input() resource: Resource;
    @Input() hideRelations: Array<string> = [];
    @Output() onRelationTargetClicked: EventEmitter<Document> = new EventEmitter<Document>();


    constructor(private datastore: ReadDatastore,
                private projectConfiguration: ProjectConfiguration,
                private resourcesComponent: ResourcesComponent,
                private routingService: RoutingService,
                private sidebarListComponent: SidebarListComponent) {}


    public isScrollbarVisible = (element: HTMLElement) =>
        this.sidebarListComponent.isScrollbarVisible(element);

    public closePopover = () => this.sidebarListComponent.closePopover();


    async ngOnChanges() {

        this.relations = [];

        if (this.resource) {
            await this.processRelations(this.resource);
        } else {
            this.relationsCount = 0;
        }
    }


    public async jumpToResource(document: FieldDocument) {

        this.closePopover();
        await this.routingService.jumpToResource(document);
        this.resourcesComponent.setScrollTarget(document);
    }


    private async processRelations(resource: Resource) {

        const relationNames: string[] = await Object.keys(resource.relations)
            .filter(name => this.projectConfiguration.isVisibleRelation(name, this.resource.type))
            .filter(name => this.hideRelations.indexOf(name) === -1);

        for (let name of relationNames) {
            await this.addRel(resource, name, this.projectConfiguration.getRelationDefinitionLabel(name))
        }

        this.relationsCount = this.relations.reduce(
            (totalCount: number, relation: any) => {
                console.log(relation); return totalCount + relation.targets.length; }, 0
        );
    }


    private async addRel(resource: Resource, relationName: string, relLabel: string) {

        const relationGroup = {
            name: relLabel,
            targets: (await this.getTargetDocuments(resource.relations[relationName])) as any
        };

        if (relationGroup.targets.length > 0) this.relations.push(relationGroup);
    }


    private getTargetDocuments(targetIds: Array<string>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds);
    }
}