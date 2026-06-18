import { ConfigReader } from '../../src/configuration/boot/config-reader';
import { getConfigurationName, PROJECT_MAPPING } from '../../src/configuration/project-configuration-names';


describe('KoreanFieldwork project configuration', () => {

    it('maps Korean fieldwork project identifiers to the KoreanFieldwork configuration', () => {

        expect(getConfigurationName('korean-fieldwork')).toBe('KoreanFieldwork');
        expect(getConfigurationName('korean-fieldwork-training')).toBe('KoreanFieldwork');
        expect(PROJECT_MAPPING['korean-fieldwork'].prefix).toBe('KoreanFieldwork');
    });


    it('registers the field-record preservation fields in the bundled configuration', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const operationForm = config.forms['Operation:default'];
        const projectForm = config.forms['Project:default'];

        expect(operationForm.fields.fieldRecordQuality.inputType).toBe('checkboxes');
        expect(operationForm.fields.personalNotebookArchive.inputType).toBe('checkboxes');
        expect(operationForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(projectForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');

        expect(operationForm.valuelists.fieldRecordQuality).toBe('KoreanFieldwork-fieldRecordQuality');
        expect(operationForm.valuelists.personalNotebookArchive).toBe('KoreanFieldwork-personalNotebookArchive');
        expect(operationForm.valuelists.digitalSourcePreservation).toBe('KoreanFieldwork-digitalSourcePreservation');
    });


    it('provides project language and valuelist labels for the field-record preservation fields', () => {

        const configReader = new ConfigReader();
        const languages = configReader.getCustomLanguageConfigurations('KoreanFieldwork');
        const valuelistLanguages = configReader.getValuelistsLanguages();

        expect(languages.en.categories.Operation.fields.fieldRecordQuality.label).toBe('Field record quality');
        expect(languages.en.categories.Operation.fields.personalNotebookArchive.label).toBe('Personal notebook archive');
        expect(languages.en.categories.Project.fields.digitalSourcePreservation.label).toBe('Digital source preservation');
        expect(languages.ko.categories.Operation.fields.fieldRecordQuality.label).toBeDefined();

        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBe('Immediate recording');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-personalNotebookArchive'].values.originalSubmitted.label)
            .toBe('Original submitted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSourcePreservation'].values.backupVerified.label)
            .toBe('Backup verified');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBeDefined();
    });
});
