import { Component, Input, ViewChild, ChangeDetectorRef, OnChanges, AfterViewChecked,
    SimpleChanges } from '@angular/core';
import { isObject, isString, Map, equal, isEmpty, clone } from 'tsfun';
import { FieldDocument, CategoryForm, Datastore, RelationsManager, ProjectConfiguration, Labels, I18N, FieldResource,
    Valuelist } from 'idai-field-core';
import { ResourcesComponent } from '../resources.component';
import { Validator } from '../../../model/validator';
import { M } from '../../messages/m';
import { MessagesConversion } from '../../docedit/messages-conversion';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { NavigationService } from '../navigation/navigation-service';
import { Messages } from '../../messages/messages';
import { Language } from '../../../services/languages';
import { IdentifierInputComponent } from '../../widgets/identifier-input.component';


@Component({
    selector: 'row',
    templateUrl: './row.html',
    standalone: false
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RowComponent implements AfterViewChecked, OnChanges {

    @Input() document: FieldDocument;
    @Input() category: CategoryForm;
    @Input() availableLanguages: Array<Language>;
    @Input() selectedLanguage: Language|undefined;
    @Input() shortDescriptionValuelist: Valuelist|undefined;
    @Input() shortDescriptionValues: string[];

    @ViewChild('identifierInput', { static: false }) identifierInput: IdentifierInputComponent;

    private initialValues: Map<string|I18N.String|undefined> = {};
    private saving: Promise<void>;
    private focusTriggered: boolean;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                private messages: Messages,
                private relationsManager: RelationsManager,
                private validator: Validator,
                private datastore: Datastore,
                private navigationService: NavigationService,
                private projectConfiguration: ProjectConfiguration,
                private changeDetectorRef: ChangeDetectorRef,
                private labels: Labels) {}


    public moveDocument = () => this.resourcesComponent.moveDocuments([this.document]);

    public deleteDocument = () => this.resourcesComponent.deleteDocument([this.document]);

    public startEditing = (fieldName: string, fieldValue: string|I18N.String) =>
        this.initialValues[fieldName] = clone(fieldValue);

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () =>
        this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public jumpToResourceInSameView =() => this.navigationService.jumpToResourceInSameView(this.document);

    public moveInto = () => this.navigationService.moveInto(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);

    public getCategoryLabel = () => this.labels.get(this.category);

    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.shortDescriptionValuelist, valueId);

    public makeId = () => this.document.resource.id
        ? 'resource-' + this.document.resource.identifier
        : 'new-resource';

    public isNewResource = () => !this.document.resource.id;


    ngOnChanges(changes: SimpleChanges) {
        
        if (changes['document']) this.focusTriggered = false;
    }


    ngAfterViewChecked() {
        
        this.focusIdentifierInputIfDocumentIsNew();
    }


    public onInput(event: KeyboardEvent, fieldName: string) {

        this.setValue(fieldName, event.target['value']);
    }


    public async onKeyUp(event: KeyboardEvent, fieldName: string) {

        if (event.key === 'Enter') {
            await this.stopEditing(fieldName, this.document.resource[fieldName]);
        }
    }


    public async onShortDescriptionValueChanged(newValue: string) {

        if (newValue) {
            this.document.resource.shortDescription = newValue;
        } else {
            delete this.document.resource.shortDescription;
        }
        
        this.saving = this.save();
        await this.saving;
    }


    public getSelectedShortDescriptionValue(): string {

        return this.document.resource.shortDescription === ''
            ? null
            : this.document.resource.shortDescription as string;
    }


    public async editDocument() {

        if (this.saving) await this.saving;

        await this.resourcesComponent.editDocument(this.document);
        this.changeDetectorRef.detectChanges();
    }


    public async jumpToResourceFromOverviewToOperation() {

        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
    }


    public async stopEditing(fieldName: string, fieldValue: string|I18N.String) {

        if (this.hasChanged(fieldName, fieldValue)) {
            this.saving = this.save();
            await this.saving;
        }
        this.initialValues[fieldName] = clone(fieldValue);
    }


    public getShortDescription(): string {

        const shortDescription = this.document.resource.shortDescription;

        return isObject(shortDescription)
            ? (shortDescription[this.selectedLanguage.code] ?? '')
            : !this.selectedLanguage || this.selectedLanguage.code === I18N.UNSPECIFIED_LANGUAGE
                ? (shortDescription ?? '')
                : '';
    }


    public isMoveOptionAvailable(): boolean {

        return !this.isNewResource()
            && this.projectConfiguration.getHierarchyParentCategories(this.document.resource.category).length > 0;
    }


    public isDeleteOptionAvailable(): boolean {

        return !this.isNewResource();
    }


    public isShortDescriptionMandatory(): boolean {

        return CategoryForm.getField(this.category, FieldResource.SHORTDESCRIPTION)?.mandatory;
    }


    private setValue(fieldName: string, newValue: string) {

        const currentValue: any = this.document.resource[fieldName];

        if (fieldName !== FieldResource.SHORTDESCRIPTION || this.isInStringInputMode()) {
            this.setValueAsString(fieldName, newValue);
        } else {
            this.setValueAsI18NString(fieldName, newValue, currentValue);
        }
    }


    private setValueAsString(fieldName: string, newValue: string) {

        if (newValue) {
            this.document.resource[fieldName] = newValue.trim();
        } else {
            this.document.resource[fieldName] = '';
        }
    }

    
    private setValueAsI18NString(fieldName: string, newValue: string, currentValue: string) {

        if (newValue.trim().length > 0) {
            if (!isObject(currentValue)) {
                this.document.resource[fieldName] = {};
                if (isString(currentValue)) {
                    this.document.resource[fieldName][I18N.UNSPECIFIED_LANGUAGE] = currentValue;
                }
            }
            this.document.resource[fieldName][this.selectedLanguage.code] = newValue;
        } else if (this.document.resource[fieldName]) {
            delete this.document.resource[fieldName][this.selectedLanguage.code];
            if (isEmpty(this.document.resource[fieldName])) {
                delete this.document.resource[fieldName];
            }
        }
    }


    private async save() {

        if (!this.hasMandatoryValues()) {
            if (!this.isNewResource()) await this.restorePreviousVersion();
            return;
        }

        try {
            await this.validator.assertIdentifierIsUnique(this.document);
        } catch(msgWithParams) {
            this.messages.add(MessagesConversion.convertMessage(msgWithParams, this.projectConfiguration, this.labels));
            if (!this.isNewResource()) await this.restorePreviousVersion();
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


    private hasMandatoryValues(): boolean {

        if (!this.document.resource.identifier) return false;
        if (this.isShortDescriptionMandatory() && !this.document.resource.shortDescription) return false;
        
        return true;
    }


    private async restorePreviousVersion(): Promise<any> {

        try {
            Object.assign(
                this.document,
                await this.datastore.get(this.document.resource.id as any, { skipCache: true })
            );
        } catch(_) {
            this.messages.add([M.DATASTORE_ERROR_NOT_FOUND]);
        }
    }


    private focusIdentifierInputIfDocumentIsNew() {

        if (!this.document.resource.identifier && !this.focusTriggered) {
            this.identifierInput.inputFieldElement.nativeElement.focus();
            this.focusTriggered = true;
        }
    }


    private hasChanged(fieldName: string, fieldValue: any): boolean {

        return (isObject(fieldValue) && isObject(this.initialValues[fieldName]))
            ? !equal(this.initialValues[fieldName] as any)(fieldValue)
            : this.initialValues[fieldName] != fieldValue;
    }


    private isInStringInputMode(): boolean {

        return !this.selectedLanguage
            || (this.selectedLanguage.code === I18N.UNSPECIFIED_LANGUAGE && this.availableLanguages.length === 1);
    }
}
