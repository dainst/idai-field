import {Component, Input, ElementRef, ViewChild, OnChanges, EventEmitter, Output} from '@angular/core';
import {Relations} from 'idai-components-2';
import {IdaiType, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {Messages} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {M} from '../../m';
import {TypeUtility} from '../../core/model/type-utility';


export type PlusButtonStatus = 'enabled'|'disabled-hierarchy';


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
    @Input() isRecordedIn: IdaiFieldDocument | undefined; // undefined when in resources overview
    @Input() liesWithin: IdaiFieldDocument;
    @Input() preselectedType: string;
    @Input() preselectedGeometryType: string;
    @Input() skipFormAndReturnNewDocument: boolean = false;
    @Input() status: PlusButtonStatus = 'enabled';

    @Output() documentRequested: EventEmitter<IdaiFieldDocument> =
        new EventEmitter<IdaiFieldDocument>();

    @ViewChild('popover') private popover: any;

    private typesTreeList: Array<IdaiType>;
    private type: string|undefined;


    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private projectConfiguration: ProjectConfiguration,
        private messages: Messages,
        private typeUtility: TypeUtility) {

        this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });
    }


    ngOnChanges() {

        this.initializeTypesTreeList(this.projectConfiguration);
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

        this.type = this.getButtonType() === 'singleType'
            ? this.typesTreeList[0].name
            : this.type = undefined;
    }


    public getButtonType(): 'singleType' | 'multipleTypes' | 'none' {

        if (this.typesTreeList.length === 0) return 'none';

        if (this.typesTreeList.length === 1
                && (!this.typesTreeList[0].children || this.typesTreeList[0].children.length === 0)) {
            return 'singleType';
        }

        return 'multipleTypes';
    }


    public chooseType(type: IdaiType) {

        this.type = type.name;
        if (this.preselectedGeometryType) this.startDocumentCreation();
    }


    public getTooltip(): string {

        switch(this.status) {
            case 'enabled':
                return '';
            case 'disabled-hierarchy':
                return 'Bitte deaktivieren Sie den erweiterten Suchmodus, um neue Ressourcen anlegen zu '
                    + 'können.';
        }
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

        if (!inside) this.popover.close();
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

        const relations: Relations = {};
        relations['isRecordedIn'] = this.isRecordedIn
            ? [this.isRecordedIn.resource.id]
            : [];

        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];
        return relations;
    }


    private getOverviewTypes() {

        return Object.keys(this.typeUtility.getSubtypes('Operation'))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    private isAllowedType(type: IdaiType, projectConfiguration: ProjectConfiguration): boolean {

        if (type.name === 'Image') return false;
        if (!this.isRecordedIn) return this.getOverviewTypes().includes(type.name);

        if (!projectConfiguration.isAllowedRelationDomainType(type.name,
                this.isRecordedIn.resource.type, 'isRecordedIn')) {
            return false;
        }

        return this.liesWithin
                ? projectConfiguration.isAllowedRelationDomainType(
                    type.name, this.liesWithin.resource.type, 'liesWithin')
                : true;
    }
}
