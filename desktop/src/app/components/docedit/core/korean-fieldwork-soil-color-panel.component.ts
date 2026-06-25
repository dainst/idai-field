import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document, Field } from 'idai-field-core';
import {
    extractMunsellCandidateOptions
} from '../../../util/korean-fieldwork-soil-color-candidates';


type SoilColorOption = {
    value: string;
    label: string;
};


const SOIL_COLOR_FIELDS = {
    assistCandidates: 'soilColorAssistCandidates',
    assistStatus: 'soilColorAssistStatus',
    captureCondition: 'soilColorCaptureCondition',
    manualMunsell: 'soilColorMunsellManual',
    moistureState: 'soilColorMoistureState',
    profileCaptureNote: 'soilProfileCaptureNote',
    profileColorNote: 'soilProfileColorNote',
    profileColorSwatches: 'soilProfileColorSwatches',
    soilColorNote: 'soilColorNote'
};


@Component({
    selector: 'korean-fieldwork-soil-color-panel',
    templateUrl: './korean-fieldwork-soil-color-panel.html',
    standalone: false
})
export class KoreanFieldworkSoilColorPanelComponent {

    @Input() document: Document;
    @Input() fieldDefinitions: Array<Field>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public readonly fields = SOIL_COLOR_FIELDS;

    public readonly munsellPresets: readonly SoilColorOption[] = [
        { value: '10YR 4/3', label: '10YR 4/3' },
        { value: '10YR 3/2', label: '10YR 3/2' },
        { value: '10YR 5/4', label: '10YR 5/4' },
        { value: '7.5YR 4/4', label: '7.5YR 4/4' },
        { value: '2.5Y 5/3', label: '2.5Y 5/3' }
    ];

    public readonly moistureOptions: readonly SoilColorOption[] = [
        { value: 'dry', label: '건조' },
        { value: 'moist', label: '습윤' },
        { value: 'wet', label: '젖음' },
        { value: 'unclear', label: '불명확' }
    ];

    public readonly captureConditionOptions: readonly SoilColorOption[] = [
        { value: 'naturalLight', label: '자연광' },
        { value: 'shade', label: '그늘' },
        { value: 'calibrationTargetUsed', label: '보정판' },
        { value: 'flash', label: '플래시' },
        { value: 'poorCondition', label: '조건 불량' }
    ];


    public shouldShow(): boolean {

        return this.canRecordLayerMunsell() || this.canRecordPhotoSwatches();
    }


    public canRecordLayerMunsell(): boolean {

        return this.document?.resource?.category === 'Layer'
            && this.hasField(SOIL_COLOR_FIELDS.manualMunsell);
    }


    public canRecordPhotoSwatches(): boolean {

        return this.document?.resource?.category === 'SoilProfilePhoto'
            && this.hasField(SOIL_COLOR_FIELDS.profileColorSwatches);
    }


    public hasField(fieldName: string): boolean {

        return this.fieldDefinitions?.some(field => field.name === fieldName && field.editable) ?? false;
    }


    public getValue(fieldName: string): string {

        const value: unknown = this.document?.resource?.[fieldName];

        return typeof value === 'string' ? value : '';
    }


    public setValue(fieldName: string, value: string) {

        if (!this.document?.resource) return;

        this.setTextResourceValue(fieldName, value);
        this.onChanged.emit();
    }


    public applyMunsellPreset(value: string) {

        if (this.canRecordLayerMunsell()) {
            this.setLayerMunsell(value);
        } else if (this.canRecordPhotoSwatches()) {
            this.setValue(
                SOIL_COLOR_FIELDS.profileColorSwatches,
                this.appendNumberedMunsellValue(this.getValue(SOIL_COLOR_FIELDS.profileColorSwatches), value)
            );
        }
    }


    public applyAssistCandidate(value: string) {

        if (this.canRecordLayerMunsell()) {
            this.setLayerMunsell(value);
        } else if (this.canRecordPhotoSwatches()) {
            this.setTextResourceValue(
                SOIL_COLOR_FIELDS.profileColorSwatches,
                this.appendNumberedMunsellValue(this.getValue(SOIL_COLOR_FIELDS.profileColorSwatches), value)
            );
            this.setAssistStatus('reviewed');
            this.onChanged.emit();
        }
    }


    public setAssistCandidates(value: string) {

        if (!this.document?.resource) return;

        this.setTextResourceValue(SOIL_COLOR_FIELDS.assistCandidates, value);
        this.setAssistStatus(value.trim() ? 'candidatesAvailable' : 'notRun');
        this.onChanged.emit();
    }


    public getAssistCandidateOptions(): string[] {

        return extractMunsellCandidateOptions(this.getValue(SOIL_COLOR_FIELDS.assistCandidates));
    }


    public setLayerMunsell(value: string) {

        if (!this.document?.resource) return;

        this.setTextResourceValue(SOIL_COLOR_FIELDS.manualMunsell, value);
        this.setAssistStatus(value.trim() ? 'manualRecorded' : 'notRun');
        this.onChanged.emit();
    }


    public isMunsellPresetActive(value: string): boolean {

        return this.canRecordLayerMunsell()
            ? this.getValue(SOIL_COLOR_FIELDS.manualMunsell) === value
            : this.getValue(SOIL_COLOR_FIELDS.profileColorSwatches).includes(value);
    }


    private appendNumberedMunsellValue(currentValue: string, value: string): string {

        const lines: string[] = currentValue
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        lines.push(`${lines.length + 1}: ${value}`);

        return lines.join('\n');
    }


    private setTextResourceValue(fieldName: string, value: string) {

        const trimmedValue = value?.trim();
        if (trimmedValue) {
            this.document.resource[fieldName] = value;
        } else {
            delete this.document.resource[fieldName];
        }
    }


    private setAssistStatus(value: string) {

        if (this.hasField(SOIL_COLOR_FIELDS.assistStatus)) {
            this.document.resource[SOIL_COLOR_FIELDS.assistStatus] = value;
        }
    }
}
