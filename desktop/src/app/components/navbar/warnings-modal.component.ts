import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map, isArray } from 'tsfun';
import { CategoryForm, FieldDocument, Labels, ProjectConfiguration, WarningType } from 'idai-field-core';
import { WarningFilter } from './taskbar-warnings.component';


type WarningSection = {
    type: WarningType;
    fieldName?: string;
}


@Component({
    templateUrl: './warnings-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class WarningsModalComponent {

    public warningFilters: Array<WarningFilter>;
    public categoryFilters: Array<CategoryForm>;
    public getConstraints: () => Map<string>;

    public selectedWarningFilter: WarningFilter;
    public selectedDocument: FieldDocument|undefined;
    public sections: Array<WarningSection> = [];


    constructor(private activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private i18n: I18n) {}

    
    public initialize() {

        this.selectWarningFilter(this.warningFilters[0].constraintName);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.close();
    }


    public getFieldLabel(section: WarningSection) {
        
        return this.labels.getFieldLabel(
            this.projectConfiguration.getCategory(this.selectedDocument.resource.category),
            section.fieldName
        ) ?? section.fieldName;
    }


    public getWarningTypeLabel(section: WarningSection): string {

        switch(section.type) {
            case 'conflicts':
                return this.i18n({ id: 'taskbar.warnings.conflicts.single', value: 'Konflikt' });
            case 'unconfigured':
                return this.i18n({ id: 'taskbar.warnings.unconfigured.single', value: 'Unkonfiguriertes Feld' });
            case 'invalid':
                return this.i18n({ id: 'taskbar.warnings.invalidFieldData', value: 'Ungültige Daten im Feld' });
            case 'outlierValues':
                return this.i18n({ id: 'taskbar.warnings.outlierValues', value: 'Ungültiger Wert im Feld' });
            case 'missingIdentifierPrefix':
                return this.i18n({ id: 'taskbar.warnings.missingIdentifierPrefix', value: 'Fehlendes Bezeichner-Präfix' });
        }
    }


    public isFieldLabelVisible(section: WarningSection): boolean {

        return ['unconfigured', 'invalid', 'outlierValues'].includes(section.type);
    }


    public selectWarningFilter(constraintName: string) {

        this.selectedWarningFilter = this.warningFilters.find(filter => filter.constraintName === constraintName);
        this.getConstraints = () => {
            const constraints: Map<string> = {};
            constraints[this.selectedWarningFilter.constraintName] = 'KNOWN';
            return constraints;
        };
    }


    public selectDocument(document: FieldDocument) {

        this.selectedDocument = document;
        this.updateSections(document);
    }


    public close() {

        this.activeModal.dismiss('cancel');
    }


    private updateSections(document: FieldDocument) {

        if (!document.warnings) return;

        this.sections = Object.keys(document.warnings).reduce((sections, warningType) => {
            if (isArray(document.warnings[warningType])) {
                return sections.concat(
                    document.warnings[warningType].map(fieldName => {
                        return { type: warningType, fieldName };
                    })
                );
            } else {
                return sections.concat([{ type: warningType }]);
            }
        }, []);
    }
}
