import {Component, Input, ElementRef, ViewChild, OnChanges, EventEmitter, Output} from '@angular/core';
import {Relations} from 'idai-components-2/core';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from './resources.component';
import {M} from '../../m';


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
    @Input() skipFormAndReturnNewDocument: boolean = false;

    @Output() documentRequested: EventEmitter<IdaiFieldDocument> =
        new EventEmitter<IdaiFieldDocument>();

    @ViewChild('popover') private popover: any;

    private typesTreeList: Array<IdaiType>;
    private type: string|undefined;

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

        const pconf = this.configLoader.getProjectConfiguration();
        if (!pconf) return;

        pconf
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
        if (this.skipFormAndReturnNewDocument) this.documentRequested.emit(newDocument);
        else this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
    }

    public reset() {

        if (this.getButtonType() == 'singleType') {
            this.type = this.typesTreeList[0].name;
        } else {
            this.type = undefined;
        }
    }

    public getButtonType(): string {

        if (this.typesTreeList.length == 0) return 'none';

        if (this.typesTreeList.length == 1
                && (!this.typesTreeList[0].children || this.typesTreeList[0].children.length == 0)) {
            return 'singleType';
        }

        return 'multipleTypes';
    }

    public chooseType(type: IdaiType) {

        this.type = type.name;
        if (this.preselectedGeometryType) this.startDocumentCreation();
    }

    private handleClick(event: any) {

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
                if (this.isAllowedType(type, projectConfiguration)
                        && (!type.parentType || !this.isAllowedType(type.parentType, projectConfiguration))) {
                    this.typesTreeList.push(type);
                }
            }
        }
    }

    private createRelations(): Relations {

        let relations: Relations = {};

        if (this.isRecordedIn) relations['isRecordedIn'] = [this.isRecordedIn.resource.id] as any;
        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id] as any;

        return relations;
    }

    private isAllowedType(type: IdaiType, projectConfiguration: ProjectConfiguration): boolean {

        if (type.name == 'Image') return false;

        if (this.isRecordedIn) {
            if (this.isRecordedIn.resource.type == 'Project' && type.isAbstract) {
                return false;
            }
            if (!projectConfiguration.isAllowedRelationDomainType(type.name,
                    this.isRecordedIn.resource.type, 'isRecordedIn')) {
                return false;
            }
        }

        if (this.liesWithin && !projectConfiguration.isAllowedRelationDomainType(type.name,
                this.liesWithin.resource.type, 'liesWithin')) {
            return false;
        }

        return true;
    }
}
