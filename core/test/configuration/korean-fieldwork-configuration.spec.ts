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
        const surveyForm = config.forms['Survey:default'];
        const featureForm = config.forms['Feature:default'];
        const featureGroupForm = config.forms['FeatureGroup:default'];
        const featureSegmentForm = config.forms['FeatureSegment:default'];
        const findForm = config.forms['Find:default'];
        const sampleForm = config.forms['Sample:default'];

        expect(operationForm.fields.fieldRecordQuality.inputType).toBe('checkboxes');
        expect(operationForm.fields.personalNotebookArchive.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogContent.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogReview.inputType).toBe('checkboxes');
        expect(operationForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(projectForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyObservation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyBiasControl.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFollowUp.inputType).toBe('checkboxes');
        expect(featureForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(sampleForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.firstExposureRecord.inputType).toBe('checkboxes');
        expect(config.forms['FeatureSegment:default'].fields.firstExposureRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationHiddenGateFunction.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationParapetDetail.inputType).toBe('checkboxes');
        expect(featureGroupForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(featureForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(findForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(sampleForm.fields.sampleCollectionHandling.inputType).toBe('checkboxes');

        expect(operationForm.valuelists.fieldRecordQuality).toBe('KoreanFieldwork-fieldRecordQuality');
        expect(operationForm.valuelists.personalNotebookArchive).toBe('KoreanFieldwork-personalNotebookArchive');
        expect(operationForm.valuelists.dailyLogContent).toBe('KoreanFieldwork-dailyLogContent');
        expect(operationForm.valuelists.dailyLogReview).toBe('KoreanFieldwork-dailyLogReview');
        expect(operationForm.valuelists.digitalSourcePreservation).toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(surveyForm.valuelists.surfaceSurveyObservation).toBe('KoreanFieldwork-surfaceSurveyObservation');
        expect(surveyForm.valuelists.surfaceSurveyBiasControl).toBe('KoreanFieldwork-surfaceSurveyBiasControl');
        expect(surveyForm.valuelists.surfaceSurveyFollowUp).toBe('KoreanFieldwork-surfaceSurveyFollowUp');
        expect(featureForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureSegmentForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(findForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(sampleForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.firstExposureRecord).toBe('KoreanFieldwork-firstExposureRecord');
        expect(featureForm.valuelists.fortificationHiddenGateFunction)
            .toBe('KoreanFieldwork-fortificationHiddenGateFunction');
        expect(featureForm.valuelists.fortificationParapetDetail)
            .toBe('KoreanFieldwork-fortificationParapetDetail');
        expect(featureForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(findForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(sampleForm.valuelists.sampleCollectionHandling)
            .toBe('KoreanFieldwork-sampleCollectionHandling');
    });


    it('provides project language and valuelist labels for the field-record preservation fields', () => {

        const configReader = new ConfigReader();
        const languages = configReader.getCustomLanguageConfigurations('KoreanFieldwork');
        const valuelistLanguages = configReader.getValuelistsLanguages();

        expect(languages.en.categories.Operation.fields.fieldRecordQuality.label).toBe('Field record quality');
        expect(languages.en.categories.Operation.fields.personalNotebookArchive.label).toBe('Personal notebook archive');
        expect(languages.en.categories.Operation.fields.dailyLogContent.label).toBe('Daily work log');
        expect(languages.en.categories.Operation.fields.dailyLogReview.label).toBe('Daily log review');
        expect(languages.en.categories.Project.fields.digitalSourcePreservation.label).toBe('Digital source preservation');
        expect(languages.en.categories.Survey.fields.surfaceSurveyObservation.label)
            .toBe('Surface survey observation');
        expect(languages.en.categories.Feature.fields.fieldOnlyMissingCheck.label)
            .toBe('Field-only missing check');
        expect(languages.en.categories.Feature.fields.firstExposureRecord.label).toBe('First exposure record');
        expect(languages.en.categories.Feature.fields.fortificationHiddenGateFunction.label).toBe('Hidden gate function');
        expect(languages.en.categories.Feature.fields.fortificationParapetDetail.label).toBe('Parapet detail');
        expect(languages.en.categories.Feature.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Find.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Sample.fields.sampleCollectionHandling.label)
            .toBe('Sample collection handling');
        expect(languages.ko.categories.Operation.fields.fieldRecordQuality.label).toBeDefined();

        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBe('Immediate recording');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-personalNotebookArchive'].values.originalSubmitted.label)
            .toBe('Original submitted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogContent'].values.workArea.label)
            .toBe('Work area');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogReview'].values.sameDayWritten.label)
            .toBe('Same-day written');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSourcePreservation'].values.backupVerified.label)
            .toBe('Backup verified');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyObservation'].values.cutSectionStratigraphy.label)
            .toBe('Cut-section stratigraphy');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyBiasControl'].values.fieldObservationFirst.label)
            .toBe('Field observation first');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyFollowUp'].values.testExcavation.label)
            .toBe('Test excavation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldOnlyMissingCheck'].values.preRemovalCondition.label)
            .toBe('Pre-removal condition');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-firstExposureRecord'].values.shoulderLineRecorded.label)
            .toBe('Shoulder line recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationHiddenGateFunction'].values.supplyTransport.label)
            .toBe('Military supply transport');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationParapetDetail'].values.nearGunOpening.label)
            .toBe('Near-range gun opening');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termAuthorityStatus'].values.pdfCrossChecked.label)
            .toBe('Source PDF cross-checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sampleCollectionHandling'].values.lightShielded.label)
            .toBe('Light-shielded');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBeDefined();
    });
});
