import {Component, Input, ElementRef, ViewChild, OnChanges, EventEmitter, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Relations, FieldDocument, Messages} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {TypeUtility} from '../../core/model/type-utility';
import {M} from '../m';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';


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

    // undefined when in resources overview
    @Input() isRecordedIn: FieldDocument | undefined;

    //undefined when current level is operation
    @Input() liesWithin: FieldDocument | undefined;


    @Input() preselectedType: string;
    @Input() preselectedGeometryType: string;
    @Input() skipFormAndReturnNewDocument: boolean = false;
    @Input() status: PlusButtonStatus = 'enabled';

    @Output() documentRequested: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    @ViewChild('popover', {static: false}) private popover: any;

    public selectedType: string|undefined;
    public typesTreeList: Array<IdaiType>;


    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private projectConfiguration: ProjectConfiguration,
        private messages: Messages,
        private typeUtility: TypeUtility,
        private viewFacade: ViewFacade,
        private i18n: I18n) {

        this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });
    }


    public isGeometryType = (typeName: string) => this.typeUtility.isGeometryType(typeName);


    ngOnChanges() {

        this.initializeTypesTreeList(this.projectConfiguration);
    }


    public startDocumentCreation(geometryType: string = this.preselectedGeometryType) {

        if (this.popover) this.popover.close();

        const newDocument: FieldDocument = <FieldDocument> {
            'resource': {
                'relations': this.createRelations(),
                'type': this.selectedType
            }
        };
        if (this.skipFormAndReturnNewDocument) this.documentRequested.emit(newDocument);
        else this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
    }


    public reset() {

        this.selectedType = this.getButtonType() === 'singleType'
            ? this.typesTreeList[0].name
            : this.selectedType = undefined;
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

        this.selectedType = type.name;

        if (this.preselectedGeometryType) {
            this.startDocumentCreation();
        } else if (!this.isGeometryType(this.selectedType)) {
            this.startDocumentCreation('none');
        }
    }


    public getTooltip(): string {

        switch(this.status) {
            case 'enabled':
                return '';
            case 'disabled-hierarchy':
                return this.i18n({
                    id: 'resources.plusButton.tooltip.deactivated',
                    value: 'Bitte deaktivieren Sie den erweiterten Suchmodus, um neue Ressourcen anlegen zu können.'
                });
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
            if (type) {
                this.typesTreeList.push(type);
            } else {
                this.messages.add([M.RESOURCES_ERROR_TYPE_NOT_FOUND, this.preselectedType]);
            }
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


    // TODO Move this to TypeUtility
    private getOverviewTypes(): string[] {

        return Object.keys(this.typeUtility.getTypeAndSubtypes('Operation'))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    // TODO Move this to TypeUtility
    private getTypeManagementTypes(): string[] {

        return Object.keys(this.typeUtility.getTypeAndSubtypes('TypeCatalog'))
            .concat(Object.keys(this.typeUtility.getTypeAndSubtypes('Type')));
    }


    private isAllowedType(type: IdaiType, projectConfiguration: ProjectConfiguration): boolean {

        if (type.name === 'Image') return false;

        if (this.isRecordedIn) {
            if (!projectConfiguration.isAllowedRelationDomainType(type.name,
                this.isRecordedIn.resource.type, 'isRecordedIn')) {
                return false;
            }
        } else {
            if (!(this.viewFacade.isInOverview()
                    ? this.getOverviewTypes().includes(type.name)
                    : this.getTypeManagementTypes().includes(type.name))) {
                return false;
            }
        }

        if (!this.liesWithin) return !type.mustLieWithin;

        return projectConfiguration.isAllowedRelationDomainType(
            type.name, this.liesWithin.resource.type, 'liesWithin'
        );
    }
}
