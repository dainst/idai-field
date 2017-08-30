import {Component, Input, ElementRef, ViewChild, OnChanges} from '@angular/core';
import {Relations} from 'idai-components-2/core';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from './resources.component';
import {M} from '../m';


@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html'
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

    @ViewChild('popover') private popover;

    private typesTreeList: Array<IdaiType>;
    private type: string;

    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private configLoader: ConfigLoader,
        private messages: Messages) {

        this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });
    }

    ngOnChanges() {

        this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => this.initializeTypesTreeList(projectConfiguration))
            .catch(() => {});
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

        if (this.isSingleTypeButton()) {
            this.type = this.typesTreeList[0].name;
        } else {
            this.type = undefined;
        }
    }

    public isSingleTypeButton(): boolean {

        return this.typesTreeList.length == 1
            && (!this.typesTreeList[0].children || this.typesTreeList[0].children.length == 0);
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
            const type = projectConfiguration.getTypesMap()[this.preselectedType];
            if (type) this.typesTreeList.push(type);
            else this.messages.add([M.RESOURCES_ERROR_TYPE_NOT_FOUND, this.preselectedType]);
        } else {
            for (let type of projectConfiguration.getTypesList()) {
                if (this.isAllowedType(type, projectConfiguration)) {
                    this.typesTreeList.push(type);
                }
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

        if (type.name == 'Image') return false;

        if (this.isRecordedIn && !projectConfiguration.isAllowedRelationDomainType(type.name,
                this.isRecordedIn.resource.type, 'isRecordedIn')) {
            return false;
        }

        if (this.liesWithin && !projectConfiguration.isAllowedRelationDomainType(type.name,
                this.liesWithin.resource.type, 'liesWithin')) {
            return false;
        }

        return true;
    }


}
