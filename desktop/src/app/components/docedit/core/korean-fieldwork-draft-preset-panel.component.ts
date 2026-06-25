import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output
} from '@angular/core';
import {
    CategoryForm,
    Document,
    Field,
    ProjectConfiguration
} from 'idai-field-core';
import {
    getKoreanFieldworkDraftPresets,
    KoreanFieldworkAvailableDraftPreset
} from '../../../util/korean-fieldwork-draft-presets';


@Component({
    selector: 'korean-fieldwork-draft-preset-panel',
    templateUrl: './korean-fieldwork-draft-preset-panel.html',
    styleUrls: ['./korean-fieldwork-draft-preset-panel.scss'],
    standalone: false
})
export class KoreanFieldworkDraftPresetPanelComponent implements OnChanges {

    @Input() document: Document;
    @Input() fieldDefinitions: Array<Field>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public presets: KoreanFieldworkAvailableDraftPreset[] = [];


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        if (!this.document?.resource) {
            this.presets = [];
            return;
        }

        this.presets = getKoreanFieldworkDraftPresets(
            this.getCategory(),
            this.document?.resource
        );
    }


    public shouldShow = () => this.presets.length > 0;


    public getPresets = () => this.presets;


    public applyPreset(preset: KoreanFieldworkAvailableDraftPreset) {

        Object.entries(preset.updates).forEach(([fieldName, value]) => {
            this.document.resource[fieldName] = Array.isArray(value)
                ? value.slice()
                : value;
        });

        this.onChanged.emit();
        this.ngOnChanges();
    }


    private getCategory(): CategoryForm|undefined {

        const categoryName = this.document?.resource?.category;
        if (!categoryName || !this.hasKoreanFieldworkPresetFields()) return undefined;

        try {
            return this.projectConfiguration.getCategory(categoryName);
        } catch (_) {
            return undefined;
        }
    }


    private hasKoreanFieldworkPresetFields(): boolean {

        return this.fieldDefinitions?.some(field => [
            'featureRecordingStatus',
            'featureInvestigationChecklist',
            'fieldRecordQuality',
            'recordCreationTiming',
            'verificationState'
        ].includes(field.name)) ?? false;
    }
}
