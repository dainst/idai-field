import {Component, Input, ElementRef, ViewChild, OnChanges} from '@angular/core';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
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

    @Input() placement: string = 'bottom'; // top | bottom | left | right
    @Input() isRecordedIn: IdaiFieldDocument;
    @Input() liesWithin: IdaiFieldDocument;
    @Input() preselectedType: string;
    @Input() preselectedGeometryType: string;

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
        }).catch(() => {});
    }

    public startDocumentCreation(geometryType: string = this.preselectedGeometryType) {

        if (this.popover) this.popover.close();

        const newDocument: IdaiFieldDocument = <IdaiFieldDocument> {
            'resource': {
                'relations': this.createRelations(),
                'type': this.type
            }
        };

        this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
    }

    public reset() {

        this.type = this.preselectedType;
    }

    public chooseType(type: IdaiType) {

        if (type.isAbstract) return;

        this.type = type.name;
        if (this.preselectedGeometryType) this.startDocumentCreation();
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

        if (this.preselectedType) {
            this.typesTreeList.push(projectConfiguration.getTypesMap()[this.preselectedType]);
        } else {
            for (let type of projectConfiguration.getTypesTreeList()) {
                if (this.isAllowedType(type, projectConfiguration)) {
                    this.typesTreeList.push(type);
                }
            }
        }
    }

    private createRelations(): Relations {

        let relations: Relations = {};

        if (this.isRecordedIn && this.isRecordedIn.resource.type == 'project') {
            return relations;
        }

        if (this.isRecordedIn) relations['isRecordedIn'] = [this.isRecordedIn.resource.id];
        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];

        return relations;
    }

    private isAllowedType(type: IdaiType, projectConfiguration: ProjectConfiguration): boolean {

        if (type.name == 'image') return false;

        let isRecordedInType = this.isRecordedIn ? this.isRecordedIn.resource.type : 'project';
        if (!projectConfiguration.isAllowedRelationDomainType(type.name, isRecordedInType, 'isRecordedIn')) {
            return false;
        }

        if (this.liesWithin && !projectConfiguration.isAllowedRelationDomainType(type.name,
                this.liesWithin.resource.type, 'liesWithin')) {
            return false;
        }

        return true;
    }


}
