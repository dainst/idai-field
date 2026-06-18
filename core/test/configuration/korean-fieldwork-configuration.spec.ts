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
        const fieldRecordQualityReviewForm = config.forms.FieldRecordQualityReview;
        const dailyLogForm = config.forms.DailyLog;
        const termAuthorityForm = config.forms.TermAuthority;
        const findForm = config.forms['Find:default'];
        const sampleForm = config.forms['Sample:default'];
        const drawingForm = config.forms['Drawing:default'];
        const photoForm = config.forms['Photo:default'];

        expect(fieldRecordQualityReviewForm.parent).toBe('Operation');
        expect(fieldRecordQualityReviewForm.fields.reviewedRecordUnit.inputType).toBe('checkboxes');
        expect(fieldRecordQualityReviewForm.fields.qualityReviewStage.inputType).toBe('checkboxes');
        expect(fieldRecordQualityReviewForm.fields.qualityCorrectionBasis.inputType).toBe('checkboxes');
        expect(dailyLogForm.parent).toBe('Operation');
        expect(dailyLogForm.fields.dailyLogEvidenceRole.inputType).toBe('checkboxes');
        expect(termAuthorityForm.parent).toBe('FeatureGroup');
        expect(termAuthorityForm.fields.termDictionaryDomain.inputType).toBe('checkboxes');
        expect(termAuthorityForm.fields.termApplicationScope.inputType).toBe('checkboxes');
        expect(termAuthorityForm.fields.termSourcePriority.inputType).toBe('checkboxes');
        expect(operationForm.fields.fieldRecordQuality.inputType).toBe('checkboxes');
        expect(operationForm.fields.personalNotebookArchive.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogContent.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogReview.inputType).toBe('checkboxes');
        expect(operationForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(operationForm.fields.reportEvaluationFeedback.inputType).toBe('checkboxes');
        expect(projectForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(projectForm.fields.reportEvaluationFeedback.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyObservation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyBiasControl.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFollowUp.inputType).toBe('checkboxes');
        expect(featureForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(sampleForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.firstExposureRecord.inputType).toBe('checkboxes');
        expect(config.forms['FeatureSegment:default'].fields.firstExposureRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.fieldOnlyMissingCheck.mandatory).toBe(true);
        expect(featureSegmentForm.fields.fieldOnlyMissingCheck.mandatory).toBe(true);
        expect(findForm.fields.fieldOnlyMissingCheck.mandatory).toBe(true);
        expect(sampleForm.fields.fieldOnlyMissingCheck.mandatory).toBe(true);
        expect(featureForm.fields.firstExposureRecord.mandatory).toBe(true);
        expect(config.forms['FeatureSegment:default'].fields.firstExposureRecord.mandatory).toBe(true);
        expect(featureForm.fields.fortificationHiddenGateFunction.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationParapetDetail.inputType).toBe('checkboxes');
        expect(featureGroupForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(featureGroupForm.fields.termSearchMapping.inputType).toBe('checkboxes');
        expect(featureForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(featureForm.fields.termSearchMapping.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.termSearchMapping.inputType).toBe('checkboxes');
        expect(findForm.fields.termAuthorityStatus.inputType).toBe('checkboxes');
        expect(findForm.fields.termSearchMapping.inputType).toBe('checkboxes');
        expect(sampleForm.fields.sampleCollectionHandling.inputType).toBe('checkboxes');
        expect(drawingForm.fields.mediaEvidenceRole.inputType).toBe('checkboxes');
        expect(drawingForm.fields.mediaQualityCheck.inputType).toBe('checkboxes');
        expect(drawingForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(drawingForm.fields.reportCrossCheck.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaEvidenceRole.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaQualityCheck.inputType).toBe('checkboxes');
        expect(photoForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(photoForm.fields.reportCrossCheck.inputType).toBe('checkboxes');

        expect(operationForm.valuelists.fieldRecordQuality).toBe('KoreanFieldwork-fieldRecordQuality');
        expect(operationForm.valuelists.personalNotebookArchive).toBe('KoreanFieldwork-personalNotebookArchive');
        expect(operationForm.valuelists.dailyLogContent).toBe('KoreanFieldwork-dailyLogContent');
        expect(operationForm.valuelists.dailyLogReview).toBe('KoreanFieldwork-dailyLogReview');
        expect(operationForm.valuelists.digitalSourcePreservation).toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(operationForm.valuelists.reportEvaluationFeedback)
            .toBe('KoreanFieldwork-reportEvaluationFeedback');
        expect(projectForm.valuelists.reportEvaluationFeedback)
            .toBe('KoreanFieldwork-reportEvaluationFeedback');
        expect(fieldRecordQualityReviewForm.valuelists.reviewedRecordUnit)
            .toBe('KoreanFieldwork-reviewedRecordUnit');
        expect(fieldRecordQualityReviewForm.valuelists.qualityReviewStage)
            .toBe('KoreanFieldwork-qualityReviewStage');
        expect(fieldRecordQualityReviewForm.valuelists.qualityCorrectionBasis)
            .toBe('KoreanFieldwork-qualityCorrectionBasis');
        expect(fieldRecordQualityReviewForm.valuelists.fieldRecordQuality)
            .toBe('KoreanFieldwork-fieldRecordQuality');
        expect(dailyLogForm.valuelists.dailyLogContent).toBe('KoreanFieldwork-dailyLogContent');
        expect(dailyLogForm.valuelists.dailyLogEvidenceRole)
            .toBe('KoreanFieldwork-dailyLogEvidenceRole');
        expect(dailyLogForm.valuelists.dailyLogReview).toBe('KoreanFieldwork-dailyLogReview');
        expect(termAuthorityForm.valuelists.termDictionaryDomain)
            .toBe('KoreanFieldwork-termDictionaryDomain');
        expect(termAuthorityForm.valuelists.termApplicationScope)
            .toBe('KoreanFieldwork-termApplicationScope');
        expect(termAuthorityForm.valuelists.termSourcePriority)
            .toBe('KoreanFieldwork-termSourcePriority');
        expect(termAuthorityForm.valuelists.termAuthorityStatus)
            .toBe('KoreanFieldwork-termAuthorityStatus');
        expect(surveyForm.valuelists.surfaceSurveyObservation).toBe('KoreanFieldwork-surfaceSurveyObservation');
        expect(surveyForm.valuelists.surfaceSurveyBiasControl).toBe('KoreanFieldwork-surfaceSurveyBiasControl');
        expect(surveyForm.valuelists.surfaceSurveyFollowUp).toBe('KoreanFieldwork-surfaceSurveyFollowUp');
        expect(featureForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.typologyArgument).toBe('KoreanFieldwork-typologyArgument');
        expect(featureForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(featureForm.valuelists.assemblageRelation).toBe('KoreanFieldwork-assemblageRelation');
        expect(featureSegmentForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureSegmentForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(findForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(findForm.valuelists.typologyArgument).toBe('KoreanFieldwork-typologyArgument');
        expect(findForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(findForm.valuelists.assemblageRelation).toBe('KoreanFieldwork-assemblageRelation');
        expect(sampleForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.firstExposureRecord).toBe('KoreanFieldwork-firstExposureRecord');
        expect(featureForm.valuelists.fortificationHiddenGateFunction)
            .toBe('KoreanFieldwork-fortificationHiddenGateFunction');
        expect(featureForm.valuelists.fortificationParapetDetail)
            .toBe('KoreanFieldwork-fortificationParapetDetail');
        expect(featureForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(featureForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(findForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(findForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(sampleForm.valuelists.sampleCollectionHandling)
            .toBe('KoreanFieldwork-sampleCollectionHandling');
        expect(drawingForm.valuelists.mediaEvidenceRole).toBe('KoreanFieldwork-mediaEvidenceRole');
        expect(drawingForm.valuelists.mediaQualityCheck).toBe('KoreanFieldwork-mediaQualityCheck');
        expect(drawingForm.valuelists.digitalSourcePreservation)
            .toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(drawingForm.valuelists.reportCrossCheck).toBe('KoreanFieldwork-reportCrossCheck');
        expect(photoForm.valuelists.mediaEvidenceRole).toBe('KoreanFieldwork-mediaEvidenceRole');
        expect(photoForm.valuelists.mediaQualityCheck).toBe('KoreanFieldwork-mediaQualityCheck');
        expect(photoForm.valuelists.digitalSourcePreservation)
            .toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(photoForm.valuelists.reportCrossCheck).toBe('KoreanFieldwork-reportCrossCheck');
    });


    it('provides project language and valuelist labels for the field-record preservation fields', () => {

        const configReader = new ConfigReader();
        const languages = configReader.getCustomLanguageConfigurations('KoreanFieldwork');
        const valuelistLanguages = configReader.getValuelistsLanguages();

        expect(languages.en.categories.FieldRecordQualityReview.label).toBe('Field record quality review');
        expect(languages.en.categories.FieldRecordQualityReview.fields.reviewedRecordUnit.label)
            .toBe('Reviewed record unit');
        expect(languages.en.categories.DailyLog.label).toBe('Daily log');
        expect(languages.en.categories.DailyLog.fields.dailyLogEvidenceRole.label)
            .toBe('Daily log evidence role');
        expect(languages.en.categories.TermAuthority.label).toBe('Term authority');
        expect(languages.en.categories.TermAuthority.fields.termDictionaryDomain.label)
            .toBe('Dictionary domain');
        expect(languages.en.categories.Operation.fields.fieldRecordQuality.label).toBe('Field record quality');
        expect(languages.en.categories.Operation.fields.personalNotebookArchive.label).toBe('Personal notebook archive');
        expect(languages.en.categories.Operation.fields.dailyLogContent.label).toBe('Daily work log');
        expect(languages.en.categories.Operation.fields.dailyLogReview.label).toBe('Daily log review');
        expect(languages.en.categories.Project.fields.digitalSourcePreservation.label).toBe('Digital source preservation');
        expect(languages.en.categories.Project.fields.reportEvaluationFeedback.label)
            .toBe('Report evaluation feedback');
        expect(languages.en.categories.Survey.fields.surfaceSurveyObservation.label)
            .toBe('Surface survey observation');
        expect(languages.en.categories.Feature.fields.fieldOnlyMissingCheck.label)
            .toBe('Field-only missing check');
        expect(languages.en.categories.Feature.fields.typologyArgument.label).toBe('Typology argument');
        expect(languages.en.categories.Feature.fields.chronologyArgument.label).toBe('Chronology argument');
        expect(languages.en.categories.Feature.fields.assemblageRelation.label).toBe('Assemblage relation');
        expect(languages.en.categories.Feature.fields.firstExposureRecord.label).toBe('First exposure record');
        expect(languages.en.categories.Feature.fields.fortificationHiddenGateFunction.label).toBe('Hidden gate function');
        expect(languages.en.categories.Feature.fields.fortificationParapetDetail.label).toBe('Parapet detail');
        expect(languages.en.categories.Feature.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Feature.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.Find.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Find.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.Find.fields.typologyArgument.label).toBe('Typology argument');
        expect(languages.en.categories.Find.fields.chronologyArgument.label).toBe('Chronology argument');
        expect(languages.en.categories.Find.fields.assemblageRelation.label).toBe('Assemblage relation');
        expect(languages.en.categories.Sample.fields.sampleCollectionHandling.label)
            .toBe('Sample collection handling');
        expect(languages.en.categories.Drawing.fields.mediaEvidenceRole.label)
            .toBe('Media evidence role');
        expect(languages.en.categories.Photo.fields.mediaQualityCheck.label)
            .toBe('Media quality check');
        expect(languages.ko.categories.Operation.fields.fieldRecordQuality.label).toBeDefined();

        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBe('Immediate recording');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-personalNotebookArchive'].values.originalSubmitted.label)
            .toBe('Original submitted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogContent'].values.workArea.label)
            .toBe('Work area');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogReview'].values.sameDayWritten.label)
            .toBe('Same-day written');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogEvidenceRole']
            .values.cumulativeWorkerCount.label)
            .toBe('Cumulative worker count');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSourcePreservation'].values.backupVerified.label)
            .toBe('Backup verified');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-reviewedRecordUnit'].values.personalNotebook.label)
            .toBe('Personal notebook');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-qualityReviewStage'].values.sameDayReview.label)
            .toBe('Same-day review');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-qualityCorrectionBasis'].values.noSilentRewrite.label)
            .toBe('No silent rewrite');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-reportEvaluationFeedback'].values.selfEvaluation.label)
            .toBe('Institution self-evaluation');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termSearchMapping'].values.reportOutputSeparated.label)
            .toBe('Report output separated');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termDictionaryDomain'].values.fortificationBeacon.label)
            .toBe('Fortification and beacon');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termApplicationScope'].values.reportOutput.label)
            .toBe('Report output');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termSourcePriority']
            .values.domainSpecialistDictionary.label)
            .toBe('Domain specialist dictionary');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-typologyArgument']
            .values.representativeAttribute.label)
            .toBe('Representative attribute');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-chronologyArgument']
            .values.alternativeChronology.label)
            .toBe('Alternative chronology');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-assemblageRelation']
            .values.accidentalAssociationRisk.label)
            .toBe('Accidental association risk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sampleCollectionHandling'].values.lightShielded.label)
            .toBe('Light-shielded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaEvidenceRole']
            .values.stratigraphicEvidence.label)
            .toBe('Stratigraphic evidence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaQualityCheck']
            .values.retakeOrRedrawNeeded.label)
            .toBe('Retake or redraw needed');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBeDefined();
    });
});
