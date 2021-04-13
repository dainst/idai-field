import {AfterViewInit, Component, ElementRef, Input, ViewChild, ChangeDetectorRef} from '@angular/core';
import {FieldDocument, Category, Datastore} from 'idai-field-core';
import {ResourcesComponent} from '../resources.component';
import {RelationsManager} from '../../../core/model/relations-manager';
import {Validator} from '../../../core/model/validator';
import {M} from '../../messages/m';
import {MessagesConversion} from '../../docedit/messages-conversion';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {NavigationService} from '../../../core/resources/navigation/navigation-service';
import {Messages} from '../../messages/messages';


@Component({
    selector: 'row',
    templateUrl: './row.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RowComponent implements AfterViewInit {

    @Input() document: FieldDocument;
    @Input() categoriesMap: { [category: string]: Category };

    @ViewChild('identifierInput', { static: false }) identifierInput: ElementRef;

    private initialValueOfCurrentlyEditedField: string|undefined;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                private messages: Messages,
                private relationsManager: RelationsManager,
                private validator: Validator,
                private datastore: Datastore,
                private navigationService: NavigationService,
                private projectConfiguration: ProjectConfiguration,
                private changeDetectorRef: ChangeDetectorRef) {}


    public moveDocument = () => this.resourcesComponent.moveDocuments([this.document]);

    public deleteDocument = () => this.resourcesComponent.deleteDocument([this.document]);

    public startEditing = (fieldValue: string) => this.initialValueOfCurrentlyEditedField = fieldValue;

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public jumpToResourceInSameView =() => this.navigationService.jumpToResourceInSameView(this.document);

    public moveInto = () => this.navigationService.moveInto(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);

    public getCategoryLabel = () => this.categoriesMap[this.document.resource.category].label;

    public makeId = () => this.document.resource.id
        ? 'resource-' + this.document.resource.identifier
        : 'new-resource';


    ngAfterViewInit() {

        this.focusIdentifierInputIfDocumentIsNew();
    }


    public async onKeyUp(event: KeyboardEvent, fieldValue: string) {

        if (event.key === 'Enter') await this.stopEditing(fieldValue);
    }


    public async editDocument() {

        await this.resourcesComponent.editDocument(this.document);
        this.changeDetectorRef.detectChanges();
    }


    public async jumpToResourceFromOverviewToOperation() {

        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
    }


    public async stopEditing(fieldValue: string) {

        if (this.initialValueOfCurrentlyEditedField != fieldValue) await this.save();
        this.initialValueOfCurrentlyEditedField = fieldValue;
    }


    public isMoveOptionAvailable(): boolean {

        return this.projectConfiguration.getHierarchyParentCategories(this.document.resource.category).length > 0;
    }


    private async save() {

        if (!this.document.resource.identifier || this.document.resource.identifier === '') return;

        try {
            await this.validator.assertIdentifierIsUnique(this.document);
            await this.validator.assertIsRecordedInTargetsExist(this.document);
        } catch(msgWithParams) {
            this.messages.add(MessagesConversion.convertMessage(msgWithParams, this.projectConfiguration));
            await this.restoreIdentifier(this.document);
            this.changeDetectorRef.detectChanges();
            return;
        }

        try {
            Object.assign(
                this.document,
                await this.relationsManager.update(this.document)
            );
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.changeDetectorRef.detectChanges();
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
