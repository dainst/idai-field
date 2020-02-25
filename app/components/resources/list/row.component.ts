import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {FieldDocument, Messages} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {Validator} from '../../../core/model/validator';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {M} from '../../messages/m';
import {MessagesConversion} from '../../docedit/messages-conversion';
import {IdaiType} from '../../../core/configuration/model/idai-type';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {ProjectTypes} from '../../../core/configuration/project-types';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {NavigationService} from '../../../core/resources/navigation/navigation-service';


@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RowComponent implements AfterViewInit {

    @Input() document: FieldDocument;
    @Input() typesMap: { [type: string]: IdaiType };

    @ViewChild('identifierInput', {static: false}) identifierInput: ElementRef;

    private initialValueOfCurrentlyEditedField: string|undefined;


    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private validator: Validator,
        private datastore: FieldReadDatastore,
        private navigationService: NavigationService,
        private projectConfiguration: ProjectConfiguration,
        private projectTypes: ProjectTypes
    ) {}


    public editDocument = () => this.resourcesComponent.editDocument(this.document);

    public moveDocument = () => this.resourcesComponent.moveDocument(this.document);

    public deleteDocument = () => this.resourcesComponent.deleteDocument(this.document);

    public startEditing = (fieldValue: string) => this.initialValueOfCurrentlyEditedField = fieldValue;

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public jumpToResourceInSameView =() => this.navigationService.jumpToResourceInSameView(this.document);

    public moveInto = () => this.navigationService.moveInto(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);

    public getTypeLabel = () => this.typesMap[this.document.resource.type].label;

    public makeId = () => this.document.resource.id
        ? 'resource-' + this.document.resource.identifier
        : 'new-resource';


    ngAfterViewInit() {

        this.focusIdentifierInputIfDocumentIsNew();
    }


    public async onKeyUp(event: KeyboardEvent, fieldValue: string) {

        if (event.key === 'Enter') await this.stopEditing(fieldValue);
    }


    public async jumpToResourceFromOverviewToOperation() {

        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
        this.resourcesComponent.setScrollTarget(this.document);
    }


    public async stopEditing(fieldValue: string) {

        if (this.initialValueOfCurrentlyEditedField != fieldValue) await this.save();
        this.initialValueOfCurrentlyEditedField = fieldValue;
    }


    public isMoveOptionAvailable(): boolean {

        return this.projectTypes.getHierarchyParentTypes(this.document.resource.type).length > 0;
    }


    private async save() {

        if (!this.document.resource.identifier || this.document.resource.identifier === '') return;

        try {
            await this.validator.assertIdentifierIsUnique(this.document);
            await this.validator.assertIsRecordedInTargetsExist(this.document);
        } catch(msgWithParams) {
            this.messages.add(MessagesConversion.convertMessage(msgWithParams, this.projectConfiguration));
            await this.restoreIdentifier(this.document);
            return;
        }

        try {
            Object.assign(
                this.document,
                await this.persistenceManager.persist(this.document, this.usernameProvider.getUsername())
            );
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async restoreIdentifier(document: FieldDocument): Promise<any> {

        try {
            Object.assign(
                this.document,
                await this.datastore.get(document.resource.id as any, { skipCache: true })
            );
        } catch(_) {
            this.messages.add([M.DATASTORE_ERROR_NOT_FOUND]);
        }
    }


    private focusIdentifierInputIfDocumentIsNew() {

        if (!this.document.resource.identifier) this.identifierInput.nativeElement.focus();
    }
}