import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { isUndefinedOrEmpty, clone, Map } from 'tsfun';
import { Condition, Document, Field, Group, KOREAN_FIELDWORK_GROUP_NAME, Labels, Resource } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';
import { AngularUtility } from '../../../angular/angular-utility';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import {
    KoreanFieldworkReadinessPanelComponent
} from './korean-fieldwork-readiness-panel.component';
import {
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS
} from '../../../util/korean-fieldwork-feature-guidance';

const SYSTEM_RAW_GROUP_NAMES = new Set(['hierarchy', 'workflow', 'identification', 'inventory']);
const NON_RAW_STORAGE_GROUP_NAMES = new Set(['conflicts', 'images', 'stem']);
const KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES = new Set([
    'AerialMapLayer',
    'DailyLog',
    'Drawing',
    'Feature',
    'FeatureGroup',
    'FeatureSegment',
    'FieldRecordQualityReview',
    'Find',
    'FindCollection',
    'Layer',
    'Operation',
    'PenMemo',
    'Photo',
    'Place',
    'Sample',
    'SoilProfilePhoto',
    'SourceEvidenceIndex',
    'Survey',
    'SurveyBoundary',
    'Trench'
]);
const KOREAN_FIELDWORK_FEATURE_GUIDANCE_FIELD_NAMES = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.flatMap(preset =>
    preset.checklists.map(checklist => checklist.fieldName)
);
const KOREAN_FIELDWORK_PANEL_FIELD_NAMES: string[] = Array.from(new Set([
    'description',
    'featureChecklistNote',
    'featureGeometryEditStatus',
    'featureGeometryReferenceLayerId',
    'featureGeometryRevisionHistory',
    'featureGeometryRevisionNote',
    'featureInvestigationChecklist',
    'featureInterpretationType',
    'featurePackage',
    'featureRecordingStatus',
    'featureSoilProfilePhotoCount',
    'featureType',
    'fieldIdentifier',
    'fieldRecordQuality',
    'geometryConfidence',
    'geometrySource',
    'identifier',
    'identifierRevisionHistory',
    'identifierRevisionNote',
    'interpretation',
    'longAxisOrientation',
    'orientationNote',
    'orientationReference',
    'period',
    'recordCreationTiming',
    'reportIdentifier',
    'shortAxisOrientation',
    'shortDescription',
    'soilColorAssistCandidates',
    'soilColorAssistStatus',
    'soilColorCaptureCondition',
    'soilColorMoistureState',
    'soilColorMunsellManual',
    'soilColorNote',
    'soilColorReviewed',
    'soilColorRoi',
    'soilProfileCaptureNote',
    'soilProfileColorNote',
    'soilProfileColorSwatches',
    'verificationState',
    ...KOREAN_FIELDWORK_FEATURE_GUIDANCE_FIELD_NAMES
]));
const KOREAN_FIELDWORK_MODE_TRIGGER_FIELD_NAMES: string[] = [
    'featureChecklistNote',
    'featureGeometryEditStatus',
    'featureInvestigationChecklist',
    'featureInterpretationType',
    'featurePackage',
    'featureRecordingStatus',
    'featureSoilProfilePhotoCount',
    'featureType',
    'fieldIdentifier',
    'fieldRecordQuality',
    'geometryConfidence',
    'geometrySource',
    'longAxisOrientation',
    'period',
    'recordCreationTiming',
    'reportIdentifier',
    'soilColorAssistStatus',
    'verificationState',
    ...KOREAN_FIELDWORK_FEATURE_GUIDANCE_FIELD_NAMES
];

@Component({
    selector: 'edit-form',
    templateUrl: './edit-form.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', { static: false }) rootElement: ElementRef;
    @ViewChild(KoreanFieldworkReadinessPanelComponent, { static: false })
    koreanFieldworkReadinessPanel?: KoreanFieldworkReadinessPanelComponent;

    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() fieldDefinitions: Array<Field>;
    @Input() originalGroups: Array<Group>;
    @Input() identifierPrefix: string|undefined;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;
    @Input() scrollTargetField: string;
    @Input() disabledRelationFields: string[];

    public extraGroups: Array<Group> = [{ name: 'conflicts', fields: [] }];
    public groups: Array<Group> = [];
    public languages: Map<Language>;
    public showKoreanFieldworkDetailedForm: boolean = false;
    public readonly koreanFieldworkPanelFieldNames: string[] = KOREAN_FIELDWORK_PANEL_FIELD_NAMES;

    private conditionsFulfilled: Map<boolean> = {};


    constructor(private elementRef: ElementRef,
                private labels: Labels,
                private messages: Messages) {

        this.languages = Languages.getAvailableLanguages();
    }


    public activateGroup = (name: string) => this.activeGroup = name;


    public toggleKoreanFieldworkDetailedForm() {

        this.showKoreanFieldworkDetailedForm = !this.showKoreanFieldworkDetailedForm;
        if (this.showKoreanFieldworkDetailedForm && !this.shouldShow(this.activeGroup)) {
            this.selectFirstNonEmptyGroup();
        }
    }

    public getGroupId = (group: Group) => 'edit-form-goto-' + group.name.replace(':', '-');


    async ngAfterViewInit() {

        await AngularUtility.refresh();
        if (!this.scrollTargetField) this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isUndefinedOrEmpty(this.originalGroups)) return;

        this.groups = [];
        for (const originalGroup of this.originalGroups) {
            const group = clone(originalGroup);
            this.groups.push(group);
        }
        this.prioritizeKoreanFieldworkGroup();
        this.groups = this.groups.concat(this.extraGroups);

        if (!this.shouldShow(this.activeGroup)) this.selectFirstNonEmptyGroup();    
        this.updateConditionsFulfilled();                  
    }


    /*
     * Called for changes in fields of input types "dropdown", "radio", "checkboxes" and "boolean"
     */
    public onChanged() {

        this.showDataDeletionWarningForUnfulfilledConditions();
        this.updateConditionsFulfilled();
    }


    public onKoreanFieldworkPanelChanged() {

        this.onChanged();
        this.koreanFieldworkReadinessPanel?.refreshIssues();
    }


    public getLabel(group: Group): string {

        return group.name === 'conflicts'
            ? $localize `:@@docedit.group.conflicts:Konflikte`
            : this.labels.get(group);
    }


    public shouldShowGroupNavigation = () =>
        this.groups.some(group => this.shouldShow(group.name));


    public shouldShow(groupName: string) {

        if (groupName === 'conflicts') return this.document._conflicts;
        if (this.shouldHideCollapsedKoreanFieldworkDetailGroup(groupName)) return false;
        if (this.shouldHideSystemRawGroup(groupName)) return false;
        if (this.shouldHideEmptyKoreanFieldworkRawStorageGroup(groupName)) return false;

        return this.getGroupFields(groupName).filter(field => {
            return field.editable
                && (
                    this.showKoreanFieldworkDetailedForm
                    || !this.koreanFieldworkPanelFieldNames.includes(field.name)
                )
                && Condition.isFulfilled(field.condition, this.document.resource, this.fieldDefinitions, 'field');
        }).length > 0;
    }


    public getGroupFields(groupName: string): Array<Field> {

        const fields = this.groups.find((group: Group) => group.name === groupName)?.fields ?? [];

        return this.shouldRestrictKoreanFieldworkRawStorageFields(groupName)
            ? fields.filter(field =>
                !this.koreanFieldworkPanelFieldNames.includes(field.name)
                && this.rawStorageFieldHasValue(field)
            )
            : fields;
    }


    public hasKoreanFieldworkPanelFields = () =>
        this.isKoreanFieldworkManagedCategory()
            || (this.fieldDefinitions?.some(field =>
                KOREAN_FIELDWORK_MODE_TRIGGER_FIELD_NAMES.includes(field.name)
            ) ?? false);


    public shouldShowDetailedForm = () =>
        !this.hasKoreanFieldworkPanelFields() || this.showKoreanFieldworkDetailedForm;


    public shouldShowActiveDetailedFormGroup = () =>
        this.shouldShowDetailedForm() && this.shouldShow(this.activeGroup);


    public shouldShowKoreanFieldworkRawStorageToggle = () =>
        this.hasKoreanFieldworkPanelFields()
            && (
                this.showKoreanFieldworkDetailedForm
                || this.hasKoreanFieldworkRawStorageValues()
            );


    public shouldShowKoreanFieldworkRawStorageSummary = () =>
        this.shouldShowKoreanFieldworkRawStorageToggle()
            && !this.showKoreanFieldworkDetailedForm;


    public getHiddenFieldNames = () =>
        this.showKoreanFieldworkDetailedForm
            ? []
            : this.koreanFieldworkPanelFieldNames;


    private updateConditionsFulfilled() {

        this.conditionsFulfilled = this.fieldDefinitions.reduce((result, field) => {
            result[field.name] = Condition.isFulfilled(
                field.condition, this.document.resource, this.fieldDefinitions, 'field'
            );
            return result;
        }, {});
    }


    private showDataDeletionWarningForUnfulfilledConditions() {

        const removedFields: string[] = this.fieldDefinitions.filter(field => {
            return this.conditionsFulfilled[field.name] && ! Condition.isFulfilled(
                field.condition, this.document.resource, this.fieldDefinitions, 'field'
            );
        }).filter(field => {
            return this.document.resource[field.name] !== undefined
                || this.document.resource.relations[field.name];
        }).map(field => this.labels.get(field));

        if (removedFields.length) {
            this.messages.add([M.DOCEDIT_WARNING_FIELD_DATA_DELETION, removedFields.join(', ')]);
        }
    }


    private selectFirstNonEmptyGroup() {

        const firstVisibleGroup = this.groups.find((group: Group) => this.shouldShow(group.name));

        if (firstVisibleGroup) {
            this.activateGroup(firstVisibleGroup.name);
        } else if (this.groups[0]) {
            this.activateGroup(this.groups[0].name);
        }
    }


    private prioritizeKoreanFieldworkGroup() {

        const koreanFieldworkGroupIndex = this.groups.findIndex(group => group.name === KOREAN_FIELDWORK_GROUP_NAME);
        if (koreanFieldworkGroupIndex < 1) return;

        const [koreanFieldworkGroup] = this.groups.splice(koreanFieldworkGroupIndex, 1);
        this.groups.unshift(koreanFieldworkGroup);
    }


    private shouldHideCollapsedKoreanFieldworkDetailGroup(groupName: string): boolean {

        return groupName !== 'images'
            && this.hasKoreanFieldworkPanelFields()
            && !this.showKoreanFieldworkDetailedForm;
    }


    private shouldHideSystemRawGroup(groupName: string): boolean {

        return SYSTEM_RAW_GROUP_NAMES.has(groupName)
            && this.hasKoreanFieldworkPanelFields();
    }


    private shouldHideEmptyKoreanFieldworkRawStorageGroup(groupName: string): boolean {

        return this.hasKoreanFieldworkPanelFields()
            && this.showKoreanFieldworkDetailedForm
            && this.isKoreanFieldworkRawStorageGroup(groupName)
            && !this.groupHasRawStorageValue(groupName);
    }


    private shouldRestrictKoreanFieldworkRawStorageFields(groupName: string): boolean {

        return this.hasKoreanFieldworkPanelFields()
            && this.showKoreanFieldworkDetailedForm
            && this.isKoreanFieldworkRawStorageGroup(groupName);
    }


    private hasKoreanFieldworkRawStorageValues(): boolean {

        return this.groups.some(group =>
            this.isKoreanFieldworkRawStorageGroup(group.name)
            && this.groupHasRawStorageValue(group.name)
        );
    }


    private isKoreanFieldworkRawStorageGroup(groupName: string): boolean {

        return !NON_RAW_STORAGE_GROUP_NAMES.has(groupName)
            && !SYSTEM_RAW_GROUP_NAMES.has(groupName);
    }


    private isKoreanFieldworkManagedCategory(): boolean {

        const categoryName = this.document?.resource?.category;

        return !!categoryName && KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES.has(categoryName);
    }


    private groupHasRawStorageValue(groupName: string): boolean {

        const group = this.groups.find((candidate: Group) => candidate.name === groupName);
        if (!group || !this.document?.resource) return false;

        return group.fields.some(field =>
            !this.koreanFieldworkPanelFieldNames.includes(field.name)
            && this.rawStorageFieldHasValue(field)
        );
    }


    private rawStorageFieldHasValue(field: Field): boolean {

        return !!this.document?.resource
            && (
                this.hasValue(this.document.resource[field.name])
                || this.hasValue(this.document.resource.relations?.[field.name])
            );
    }


    private hasValue(value: any): boolean {

        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement
            .getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
