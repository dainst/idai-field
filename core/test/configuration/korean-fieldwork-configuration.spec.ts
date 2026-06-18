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
        expect(surveyForm.fields.gisPredictionEvidence.inputType).toBe('checkboxes');
        expect(surveyForm.fields.gisPredictionFieldVerification.inputType).toBe('checkboxes');
        expect(surveyForm.fields.alluvialLandformSurvey.inputType).toBe('checkboxes');
        expect(surveyForm.fields.soilMapPredictionVerification.inputType).toBe('checkboxes');
        expect(featureForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingExposureBaulk.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFloorFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFireEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingOverlapSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.ironProcessEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.ironFurnaceStructure.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombMoundInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombBurialStructureInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.shellMiddenStratigraphy.inputType).toBe('checkboxes');
        expect(featureForm.fields.shellMiddenSettlementContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.bronzeAgeDwellingEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.dolmenStructureContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.bronzeAgeEnclosureInterpretation.inputType).toBe('checkboxes');
        expect(featureForm.fields.cultivationFeatureContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.cultivationTrialTrenchStrategy.inputType).toBe('checkboxes');
        expect(featureForm.fields.cultivationFeatureEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.cultivationChronologyAnalysis.inputType).toBe('checkboxes');
        expect(featureForm.fields.potteryKilnIdentification.inputType).toBe('checkboxes');
        expect(featureForm.fields.potteryKilnStructureContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.potteryKilnPartInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.potteryKilnYardFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.potteryKilnInterpretationRisk.inputType).toBe('checkboxes');
        expect(featureForm.fields.tileKilnStructureContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.tileKilnExcavationControl.inputType).toBe('checkboxes');
        expect(featureForm.fields.tileKilnPartInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.tileKilnOperationSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.charcoalKilnIdentification.inputType).toBe('checkboxes');
        expect(featureForm.fields.charcoalKilnStructurePart.inputType).toBe('checkboxes');
        expect(featureForm.fields.charcoalKilnExcavationControl.inputType).toBe('checkboxes');
        expect(featureForm.fields.charcoalKilnTraceInterpretation.inputType).toBe('checkboxes');
        expect(featureForm.fields.porcelainKilnSiteSystem.inputType).toBe('checkboxes');
        expect(featureForm.fields.porcelainWorkshopProcess.inputType).toBe('checkboxes');
        expect(featureForm.fields.porcelainKilnStructure.inputType).toBe('checkboxes');
        expect(featureForm.fields.porcelainKilnExcavationControl.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialLayerConceptAudit.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialSurfaceAttribution.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialFormationProcess.inputType).toBe('checkboxes');
        expect(findForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactHandlingWorkflow.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactQuantityBasis.inputType).toBe('checkboxes');
        expect(findForm.fields.storageEnvironmentControl.inputType).toBe('checkboxes');
        expect(findForm.fields.ironResidueSubtype.inputType).toBe('checkboxes');
        expect(findForm.fields.graveGoodsRitualContext.inputType).toBe('checkboxes');
        expect(findForm.fields.neolithicSubsistenceEvidence.inputType).toBe('checkboxes');
        expect(findForm.fields.bronzeAgePotteryTerminology.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryFiringTraceObservation.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryKilnFurnitureContext.inputType).toBe('checkboxes');
        expect(findForm.fields.tileKilnFindContext.inputType).toBe('checkboxes');
        expect(findForm.fields.porcelainFindObservation.inputType).toBe('checkboxes');
        expect(findForm.fields.porcelainKilnFurnitureContext.inputType).toBe('checkboxes');
        expect(findForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(sampleForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(sampleForm.fields.ironSampleAnalysisPlan.inputType).toBe('checkboxes');
        expect(sampleForm.fields.tileKilnAnalysisPlan.inputType).toBe('checkboxes');
        expect(sampleForm.fields.potteryKilnAnalysisPlan.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeomagneticSampleContext.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeomagneticSamplingWorkflow.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeomagneticOrientationRecord.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeomagneticResultQuality.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeomagneticChronologyInterpretation.inputType).toBe('checkboxes');
        expect(sampleForm.fields.charcoalKilnAnalysisPlan.inputType).toBe('checkboxes');
        expect(sampleForm.fields.porcelainAnalysisPlan.inputType).toBe('checkboxes');
        expect(sampleForm.fields.humanRemainsRecoveryAnalysis.inputType).toBe('checkboxes');
        expect(sampleForm.fields.shellMiddenSamplingStrategy.inputType).toBe('checkboxes');
        expect(sampleForm.fields.paleoenvironmentProxySampling.inputType).toBe('checkboxes');
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
        expect(drawingForm.fields.artifactDrawingRecordMethod.inputType).toBe('checkboxes');
        expect(drawingForm.fields.artifactDrawingPlan.inputType).toBe('checkboxes');
        expect(drawingForm.fields.artifactDrawingQualityCheck.inputType).toBe('checkboxes');
        expect(drawingForm.fields.potteryDrawingStandard.inputType).toBe('checkboxes');
        expect(drawingForm.fields.stoneToolDrawingView.inputType).toBe('checkboxes');
        expect(drawingForm.fields.waterloggedWoodDrawingHandling.inputType).toBe('checkboxes');
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
        expect(surveyForm.valuelists.gisPredictionEvidence).toBe('KoreanFieldwork-gisPredictionEvidence');
        expect(surveyForm.valuelists.gisPredictionFieldVerification)
            .toBe('KoreanFieldwork-gisPredictionFieldVerification');
        expect(surveyForm.valuelists.alluvialLandformSurvey)
            .toBe('KoreanFieldwork-alluvialLandformSurvey');
        expect(surveyForm.valuelists.soilMapPredictionVerification)
            .toBe('KoreanFieldwork-soilMapPredictionVerification');
        expect(featureForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.typologyArgument).toBe('KoreanFieldwork-typologyArgument');
        expect(featureForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(featureForm.valuelists.assemblageRelation).toBe('KoreanFieldwork-assemblageRelation');
        expect(featureForm.valuelists.pitDwellingExposureBaulk)
            .toBe('KoreanFieldwork-pitDwellingExposureBaulk');
        expect(featureForm.valuelists.pitDwellingFloorFacility)
            .toBe('KoreanFieldwork-pitDwellingFloorFacility');
        expect(featureForm.valuelists.pitDwellingFireEvidence)
            .toBe('KoreanFieldwork-pitDwellingFireEvidence');
        expect(featureForm.valuelists.pitDwellingOverlapSequence)
            .toBe('KoreanFieldwork-pitDwellingOverlapSequence');
        expect(featureForm.valuelists.ironProcessEvidence).toBe('KoreanFieldwork-ironProcessEvidence');
        expect(featureForm.valuelists.ironFurnaceStructure).toBe('KoreanFieldwork-ironFurnaceStructure');
        expect(featureForm.valuelists.tombMoundInvestigation)
            .toBe('KoreanFieldwork-tombMoundInvestigation');
        expect(featureForm.valuelists.tombBurialStructureInvestigation)
            .toBe('KoreanFieldwork-tombBurialStructureInvestigation');
        expect(featureForm.valuelists.shellMiddenStratigraphy)
            .toBe('KoreanFieldwork-shellMiddenStratigraphy');
        expect(featureForm.valuelists.shellMiddenSettlementContext)
            .toBe('KoreanFieldwork-shellMiddenSettlementContext');
        expect(featureForm.valuelists.bronzeAgeDwellingEvidence)
            .toBe('KoreanFieldwork-bronzeAgeDwellingEvidence');
        expect(featureForm.valuelists.dolmenStructureContext)
            .toBe('KoreanFieldwork-dolmenStructureContext');
        expect(featureForm.valuelists.bronzeAgeEnclosureInterpretation)
            .toBe('KoreanFieldwork-bronzeAgeEnclosureInterpretation');
        expect(featureForm.valuelists.cultivationFeatureContext)
            .toBe('KoreanFieldwork-cultivationFeatureContext');
        expect(featureForm.valuelists.cultivationTrialTrenchStrategy)
            .toBe('KoreanFieldwork-cultivationTrialTrenchStrategy');
        expect(featureForm.valuelists.cultivationFeatureEvidence)
            .toBe('KoreanFieldwork-cultivationFeatureEvidence');
        expect(featureForm.valuelists.cultivationChronologyAnalysis)
            .toBe('KoreanFieldwork-cultivationChronologyAnalysis');
        expect(featureForm.valuelists.potteryKilnIdentification)
            .toBe('KoreanFieldwork-potteryKilnIdentification');
        expect(featureForm.valuelists.potteryKilnStructureContext)
            .toBe('KoreanFieldwork-potteryKilnStructureContext');
        expect(featureForm.valuelists.potteryKilnPartInvestigation)
            .toBe('KoreanFieldwork-potteryKilnPartInvestigation');
        expect(featureForm.valuelists.potteryKilnYardFacility)
            .toBe('KoreanFieldwork-potteryKilnYardFacility');
        expect(featureForm.valuelists.potteryKilnInterpretationRisk)
            .toBe('KoreanFieldwork-potteryKilnInterpretationRisk');
        expect(featureForm.valuelists.tileKilnStructureContext)
            .toBe('KoreanFieldwork-tileKilnStructureContext');
        expect(featureForm.valuelists.tileKilnExcavationControl)
            .toBe('KoreanFieldwork-tileKilnExcavationControl');
        expect(featureForm.valuelists.tileKilnPartInvestigation)
            .toBe('KoreanFieldwork-tileKilnPartInvestigation');
        expect(featureForm.valuelists.tileKilnOperationSequence)
            .toBe('KoreanFieldwork-tileKilnOperationSequence');
        expect(featureForm.valuelists.charcoalKilnIdentification)
            .toBe('KoreanFieldwork-charcoalKilnIdentification');
        expect(featureForm.valuelists.charcoalKilnStructurePart)
            .toBe('KoreanFieldwork-charcoalKilnStructurePart');
        expect(featureForm.valuelists.charcoalKilnExcavationControl)
            .toBe('KoreanFieldwork-charcoalKilnExcavationControl');
        expect(featureForm.valuelists.charcoalKilnTraceInterpretation)
            .toBe('KoreanFieldwork-charcoalKilnTraceInterpretation');
        expect(featureForm.valuelists.porcelainKilnSiteSystem)
            .toBe('KoreanFieldwork-porcelainKilnSiteSystem');
        expect(featureForm.valuelists.porcelainWorkshopProcess)
            .toBe('KoreanFieldwork-porcelainWorkshopProcess');
        expect(featureForm.valuelists.porcelainKilnStructure)
            .toBe('KoreanFieldwork-porcelainKilnStructure');
        expect(featureForm.valuelists.porcelainKilnExcavationControl)
            .toBe('KoreanFieldwork-porcelainKilnExcavationControl');
        expect(featureSegmentForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureSegmentForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(featureSegmentForm.valuelists.alluvialLayerConceptAudit)
            .toBe('KoreanFieldwork-alluvialLayerConceptAudit');
        expect(featureSegmentForm.valuelists.alluvialSurfaceAttribution)
            .toBe('KoreanFieldwork-alluvialSurfaceAttribution');
        expect(featureSegmentForm.valuelists.alluvialFormationProcess)
            .toBe('KoreanFieldwork-alluvialFormationProcess');
        expect(findForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(findForm.valuelists.artifactHandlingWorkflow).toBe('KoreanFieldwork-artifactHandlingWorkflow');
        expect(findForm.valuelists.artifactQuantityBasis).toBe('KoreanFieldwork-artifactQuantityBasis');
        expect(findForm.valuelists.storageEnvironmentControl).toBe('KoreanFieldwork-storageEnvironmentControl');
        expect(findForm.valuelists.ironResidueSubtype).toBe('KoreanFieldwork-ironResidueSubtype');
        expect(findForm.valuelists.graveGoodsRitualContext).toBe('KoreanFieldwork-graveGoodsRitualContext');
        expect(findForm.valuelists.neolithicSubsistenceEvidence)
            .toBe('KoreanFieldwork-neolithicSubsistenceEvidence');
        expect(findForm.valuelists.bronzeAgePotteryTerminology)
            .toBe('KoreanFieldwork-bronzeAgePotteryTerminology');
        expect(findForm.valuelists.potteryFiringTraceObservation)
            .toBe('KoreanFieldwork-potteryFiringTraceObservation');
        expect(findForm.valuelists.potteryKilnFurnitureContext)
            .toBe('KoreanFieldwork-potteryKilnFurnitureContext');
        expect(findForm.valuelists.tileKilnFindContext).toBe('KoreanFieldwork-tileKilnFindContext');
        expect(findForm.valuelists.porcelainFindObservation).toBe('KoreanFieldwork-porcelainFindObservation');
        expect(findForm.valuelists.porcelainKilnFurnitureContext)
            .toBe('KoreanFieldwork-porcelainKilnFurnitureContext');
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
        expect(sampleForm.valuelists.ironSampleAnalysisPlan).toBe('KoreanFieldwork-ironSampleAnalysisPlan');
        expect(sampleForm.valuelists.tileKilnAnalysisPlan).toBe('KoreanFieldwork-tileKilnAnalysisPlan');
        expect(sampleForm.valuelists.potteryKilnAnalysisPlan).toBe('KoreanFieldwork-potteryKilnAnalysisPlan');
        expect(sampleForm.valuelists.archaeomagneticSampleContext)
            .toBe('KoreanFieldwork-archaeomagneticSampleContext');
        expect(sampleForm.valuelists.archaeomagneticSamplingWorkflow)
            .toBe('KoreanFieldwork-archaeomagneticSamplingWorkflow');
        expect(sampleForm.valuelists.archaeomagneticOrientationRecord)
            .toBe('KoreanFieldwork-archaeomagneticOrientationRecord');
        expect(sampleForm.valuelists.archaeomagneticResultQuality)
            .toBe('KoreanFieldwork-archaeomagneticResultQuality');
        expect(sampleForm.valuelists.archaeomagneticChronologyInterpretation)
            .toBe('KoreanFieldwork-archaeomagneticChronologyInterpretation');
        expect(sampleForm.valuelists.charcoalKilnAnalysisPlan)
            .toBe('KoreanFieldwork-charcoalKilnAnalysisPlan');
        expect(sampleForm.valuelists.porcelainAnalysisPlan).toBe('KoreanFieldwork-porcelainAnalysisPlan');
        expect(sampleForm.valuelists.humanRemainsRecoveryAnalysis)
            .toBe('KoreanFieldwork-humanRemainsRecoveryAnalysis');
        expect(sampleForm.valuelists.shellMiddenSamplingStrategy)
            .toBe('KoreanFieldwork-shellMiddenSamplingStrategy');
        expect(sampleForm.valuelists.paleoenvironmentProxySampling)
            .toBe('KoreanFieldwork-paleoenvironmentProxySampling');
        expect(drawingForm.valuelists.mediaEvidenceRole).toBe('KoreanFieldwork-mediaEvidenceRole');
        expect(drawingForm.valuelists.mediaQualityCheck).toBe('KoreanFieldwork-mediaQualityCheck');
        expect(drawingForm.valuelists.digitalSourcePreservation)
            .toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(drawingForm.valuelists.reportCrossCheck).toBe('KoreanFieldwork-reportCrossCheck');
        expect(drawingForm.valuelists.artifactDrawingRecordMethod)
            .toBe('KoreanFieldwork-artifactDrawingRecordMethod');
        expect(drawingForm.valuelists.artifactDrawingPlan)
            .toBe('KoreanFieldwork-artifactDrawingPlan');
        expect(drawingForm.valuelists.artifactDrawingQualityCheck)
            .toBe('KoreanFieldwork-artifactDrawingQualityCheck');
        expect(drawingForm.valuelists.potteryDrawingStandard)
            .toBe('KoreanFieldwork-potteryDrawingStandard');
        expect(drawingForm.valuelists.stoneToolDrawingView)
            .toBe('KoreanFieldwork-stoneToolDrawingView');
        expect(drawingForm.valuelists.waterloggedWoodDrawingHandling)
            .toBe('KoreanFieldwork-waterloggedWoodDrawingHandling');
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
        expect(languages.en.categories.Survey.fields.gisPredictionFieldVerification.label)
            .toBe('Prediction field verification');
        expect(languages.en.categories.Survey.fields.alluvialLandformSurvey.label)
            .toBe('Alluvial landform survey');
        expect(languages.en.categories.Survey.fields.soilMapPredictionVerification.label)
            .toBe('Soil map prediction verification');
        expect(languages.en.categories.Feature.fields.fieldOnlyMissingCheck.label)
            .toBe('Field-only missing check');
        expect(languages.en.categories.Feature.fields.typologyArgument.label).toBe('Typology argument');
        expect(languages.en.categories.Feature.fields.chronologyArgument.label).toBe('Chronology argument');
        expect(languages.en.categories.Feature.fields.assemblageRelation.label).toBe('Assemblage relation');
        expect(languages.en.categories.Feature.fields.firstExposureRecord.label).toBe('First exposure record');
        expect(languages.en.categories.Feature.fields.pitDwellingExposureBaulk.label)
            .toBe('Pit dwelling exposure and baulk');
        expect(languages.en.categories.Feature.fields.pitDwellingFireEvidence.label)
            .toBe('Burned pit dwelling evidence');
        expect(languages.en.categories.Feature.fields.ironProcessEvidence.label).toBe('Iron process evidence');
        expect(languages.en.categories.Feature.fields.ironFurnaceStructure.label).toBe('Iron furnace structure');
        expect(languages.en.categories.Feature.fields.tombMoundInvestigation.label)
            .toBe('Tomb mound investigation');
        expect(languages.en.categories.Feature.fields.tombBurialStructureInvestigation.label)
            .toBe('Tomb burial structure investigation');
        expect(languages.en.categories.Feature.fields.shellMiddenStratigraphy.label)
            .toBe('Shell midden stratigraphy');
        expect(languages.en.categories.Feature.fields.shellMiddenSettlementContext.label)
            .toBe('Shell midden settlement context');
        expect(languages.en.categories.Feature.fields.bronzeAgeDwellingEvidence.label)
            .toBe('Bronze Age dwelling evidence');
        expect(languages.en.categories.Feature.fields.dolmenStructureContext.label)
            .toBe('Dolmen structure context');
        expect(languages.en.categories.Feature.fields.bronzeAgeEnclosureInterpretation.label)
            .toBe('Bronze Age enclosure interpretation');
        expect(languages.en.categories.Feature.fields.cultivationFeatureContext.label)
            .toBe('Cultivation feature context');
        expect(languages.en.categories.Feature.fields.cultivationTrialTrenchStrategy.label)
            .toBe('Cultivation trial trench strategy');
        expect(languages.en.categories.Feature.fields.cultivationFeatureEvidence.label)
            .toBe('Cultivation feature evidence');
        expect(languages.en.categories.Feature.fields.cultivationChronologyAnalysis.label)
            .toBe('Cultivation chronology and analysis');
        expect(languages.en.categories.Feature.fields.potteryKilnIdentification.label)
            .toBe('Pottery kiln identification');
        expect(languages.en.categories.Feature.fields.potteryKilnStructureContext.label)
            .toBe('Pottery kiln structure context');
        expect(languages.en.categories.Feature.fields.potteryKilnPartInvestigation.label)
            .toBe('Pottery kiln part investigation');
        expect(languages.en.categories.Feature.fields.potteryKilnYardFacility.label)
            .toBe('Pottery kiln yard facility');
        expect(languages.en.categories.Feature.fields.potteryKilnInterpretationRisk.label)
            .toBe('Pottery kiln interpretation risk');
        expect(languages.en.categories.Feature.fields.tileKilnStructureContext.label)
            .toBe('Tile kiln structure context');
        expect(languages.en.categories.Feature.fields.tileKilnExcavationControl.label)
            .toBe('Tile kiln excavation control');
        expect(languages.en.categories.Feature.fields.tileKilnPartInvestigation.label)
            .toBe('Tile kiln part investigation');
        expect(languages.en.categories.Feature.fields.tileKilnOperationSequence.label)
            .toBe('Tile kiln operation sequence');
        expect(languages.en.categories.Feature.fields.charcoalKilnIdentification.label)
            .toBe('Charcoal kiln identification');
        expect(languages.en.categories.Feature.fields.charcoalKilnStructurePart.label)
            .toBe('Charcoal kiln structure part');
        expect(languages.en.categories.Feature.fields.charcoalKilnExcavationControl.label)
            .toBe('Charcoal kiln excavation control');
        expect(languages.en.categories.Feature.fields.charcoalKilnTraceInterpretation.label)
            .toBe('Charcoal kiln trace interpretation');
        expect(languages.en.categories.Feature.fields.porcelainKilnSiteSystem.label)
            .toBe('Porcelain kiln site system');
        expect(languages.en.categories.Feature.fields.porcelainWorkshopProcess.label)
            .toBe('Porcelain workshop process');
        expect(languages.en.categories.Feature.fields.porcelainKilnStructure.label)
            .toBe('Porcelain kiln structure');
        expect(languages.en.categories.Feature.fields.porcelainKilnExcavationControl.label)
            .toBe('Porcelain kiln excavation control');
        expect(languages.en.categories.Feature.fields.fortificationHiddenGateFunction.label).toBe('Hidden gate function');
        expect(languages.en.categories.Feature.fields.fortificationParapetDetail.label).toBe('Parapet detail');
        expect(languages.en.categories.Feature.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Feature.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.FeatureSegment.fields.alluvialLayerConceptAudit.label)
            .toBe('Alluvial layer concept audit');
        expect(languages.en.categories.FeatureSegment.fields.alluvialSurfaceAttribution.label)
            .toBe('Alluvial surface attribution');
        expect(languages.en.categories.FeatureSegment.fields.alluvialFormationProcess.label)
            .toBe('Alluvial formation process');
        expect(languages.en.categories.Find.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Find.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.Find.fields.artifactHandlingWorkflow.label)
            .toBe('Artifact handling workflow');
        expect(languages.en.categories.Find.fields.artifactQuantityBasis.label).toBe('Artifact quantity basis');
        expect(languages.en.categories.Find.fields.storageEnvironmentControl.label)
            .toBe('Storage environment control');
        expect(languages.en.categories.Find.fields.ironResidueSubtype.label).toBe('Iron residue subtype');
        expect(languages.en.categories.Find.fields.graveGoodsRitualContext.label)
            .toBe('Grave goods and ritual context');
        expect(languages.en.categories.Find.fields.neolithicSubsistenceEvidence.label)
            .toBe('Neolithic subsistence evidence');
        expect(languages.en.categories.Find.fields.bronzeAgePotteryTerminology.label)
            .toBe('Bronze Age pottery terminology');
        expect(languages.en.categories.Find.fields.potteryFiringTraceObservation.label)
            .toBe('Pottery firing trace observation');
        expect(languages.en.categories.Find.fields.potteryKilnFurnitureContext.label)
            .toBe('Pottery kiln furniture context');
        expect(languages.en.categories.Find.fields.tileKilnFindContext.label)
            .toBe('Tile kiln find context');
        expect(languages.en.categories.Find.fields.porcelainFindObservation.label)
            .toBe('Porcelain find observation');
        expect(languages.en.categories.Find.fields.porcelainKilnFurnitureContext.label)
            .toBe('Porcelain kiln furniture context');
        expect(languages.en.categories.Find.fields.typologyArgument.label).toBe('Typology argument');
        expect(languages.en.categories.Find.fields.chronologyArgument.label).toBe('Chronology argument');
        expect(languages.en.categories.Find.fields.assemblageRelation.label).toBe('Assemblage relation');
        expect(languages.en.categories.Sample.fields.sampleCollectionHandling.label)
            .toBe('Sample collection handling');
        expect(languages.en.categories.Sample.fields.ironSampleAnalysisPlan.label)
            .toBe('Iron sample analysis plan');
        expect(languages.en.categories.Sample.fields.tileKilnAnalysisPlan.label)
            .toBe('Tile kiln analysis plan');
        expect(languages.en.categories.Sample.fields.potteryKilnAnalysisPlan.label)
            .toBe('Pottery kiln analysis plan');
        expect(languages.en.categories.Sample.fields.archaeomagneticSampleContext.label)
            .toBe('Archaeomagnetic sample context');
        expect(languages.en.categories.Sample.fields.archaeomagneticSamplingWorkflow.label)
            .toBe('Archaeomagnetic sampling workflow');
        expect(languages.en.categories.Sample.fields.archaeomagneticOrientationRecord.label)
            .toBe('Archaeomagnetic orientation record');
        expect(languages.en.categories.Sample.fields.archaeomagneticResultQuality.label)
            .toBe('Archaeomagnetic result quality');
        expect(languages.en.categories.Sample.fields.archaeomagneticChronologyInterpretation.label)
            .toBe('Archaeomagnetic chronology interpretation');
        expect(languages.en.categories.Sample.fields.charcoalKilnAnalysisPlan.label)
            .toBe('Charcoal kiln analysis plan');
        expect(languages.en.categories.Sample.fields.porcelainAnalysisPlan.label)
            .toBe('Porcelain analysis plan');
        expect(languages.en.categories.Sample.fields.humanRemainsRecoveryAnalysis.label)
            .toBe('Human remains recovery and analysis');
        expect(languages.en.categories.Sample.fields.shellMiddenSamplingStrategy.label)
            .toBe('Shell midden sampling strategy');
        expect(languages.en.categories.Sample.fields.paleoenvironmentProxySampling.label)
            .toBe('Paleoenvironment proxy sampling');
        expect(languages.en.categories.Drawing.fields.mediaEvidenceRole.label)
            .toBe('Media evidence role');
        expect(languages.en.categories.Drawing.fields.artifactDrawingRecordMethod.label)
            .toBe('Artifact drawing record method');
        expect(languages.en.categories.Drawing.fields.artifactDrawingPlan.label)
            .toBe('Artifact drawing plan');
        expect(languages.en.categories.Drawing.fields.artifactDrawingQualityCheck.label)
            .toBe('Artifact drawing quality check');
        expect(languages.en.categories.Drawing.fields.potteryDrawingStandard.label)
            .toBe('Pottery drawing standard');
        expect(languages.en.categories.Drawing.fields.stoneToolDrawingView.label)
            .toBe('Stone tool drawing view');
        expect(languages.en.categories.Drawing.fields.waterloggedWoodDrawingHandling.label)
            .toBe('Waterlogged wood drawing handling');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gisPredictionEvidence'].values.aerialPhotoStereo.label)
            .toBe('Aerial-photo stereo interpretation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gisPredictionFieldVerification']
            .values.missedCandidate.label)
            .toBe('Missed candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialLandformSurvey']
            .values.noSurfaceFindsNotAbsence.label)
            .toBe('No surface finds not absence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-soilMapPredictionVerification']
            .values.soilMapDepthLimitChecked.label)
            .toBe('Soil map depth limit checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialLayerConceptAudit']
            .values.abLayerSetRecorded.label)
            .toBe('a+b layer set recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialSurfaceAttribution']
            .values.bLayerSurfaceDetection.label)
            .toBe('b-layer surface detection');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialFormationProcess']
            .values.floodDepositCandidate.label)
            .toBe('Flood deposit candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldOnlyMissingCheck'].values.preRemovalCondition.label)
            .toBe('Pre-removal condition');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactHandlingWorkflow'].values.stateVesting.label)
            .toBe('State vesting');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactQuantityBasis'].values.sameObjectConfirmed.label)
            .toBe('Same object confirmed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-storageEnvironmentControl']
            .values.currentStandardCrossCheckNeeded.label)
            .toBe('Current standard cross-check needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-firstExposureRecord'].values.shoulderLineRecorded.label)
            .toBe('Shoulder line recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingExposureBaulk']
            .values.sectionPhotoImmediate.label)
            .toBe('Immediate section photo');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingFloorFacility']
            .values.wallFloorJunctionFollowed.label)
            .toBe('Wall-floor junction followed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingFireEvidence']
            .values.fireTypeNotAssumed.label)
            .toBe('Fire type not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingOverlapSequence']
            .values.relationshipUnresolved.label)
            .toBe('Relationship unresolved');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironProcessEvidence']
            .values.metallurgicalAnalysisNeeded.label)
            .toBe('Metallurgical analysis needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironFurnaceStructure']
            .values.floorNotConfusedWithCut.label)
            .toBe('Floor not confused with cut');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironResidueSubtype'].values.furnaceInternalSlag.label)
            .toBe('Furnace-internal slag');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironSampleAnalysisPlan'].values.oxideConversion.label)
            .toBe('Oxide conversion');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombMoundInvestigation']
            .values.oldSurfaceIdentified.label)
            .toBe('Old surface identified');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombBurialStructureInvestigation']
            .values.capstoneBeforeRemoval.label)
            .toBe('Capstone before removal');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-graveGoodsRitualContext']
            .values.functionNotAssumed.label)
            .toBe('Function not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-humanRemainsRecoveryAnalysis']
            .values.dnaBeforeTreatment.label)
            .toBe('DNA before treatment');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-shellMiddenStratigraphy']
            .values.planAndSectionCombined.label)
            .toBe('Plan and section combined');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-shellMiddenSettlementContext']
            .values.inlandizedCoastChecked.label)
            .toBe('Inlandized coast checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-neolithicSubsistenceEvidence']
            .values.directWhalingEvidence.label)
            .toBe('Direct whaling evidence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-shellMiddenSamplingStrategy']
            .values.flotationUsed.label)
            .toBe('Flotation used');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleoenvironmentProxySampling']
            .values.regionalSeaLevelCurveLinked.label)
            .toBe('Regional sea-level curve linked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-bronzeAgeDwellingEvidence']
            .values.centralOvalPit.label)
            .toBe('Central oval pit');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dolmenStructureContext']
            .values.cupmarkRecorded.label)
            .toBe('Cupmark recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-bronzeAgeEnclosureInterpretation']
            .values.recutTrace.label)
            .toBe('Recut trace');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-cultivationFeatureContext']
            .values.waterManagementFirst.label)
            .toBe('Water management first');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-cultivationTrialTrenchStrategy']
            .values.furrowRidgeCrossTrench.label)
            .toBe('Furrow/ridge cross-trench');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-cultivationFeatureEvidence']
            .values.laminaPresentNaturalDeposit.label)
            .toBe('Lamina present, natural deposit');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-cultivationChronologyAnalysis']
            .values.analysisQuestionRecorded.label)
            .toBe('Analysis question recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnIdentification']
            .values.structuralKiln.label)
            .toBe('Structural kiln');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnStructureContext']
            .values.slopeNotSingleCriterion.label)
            .toBe('Slope not single criterion');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnPartInvestigation']
            .values.kilnFloorSoftCaution.label)
            .toBe('Kiln floor soft caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnYardFacility']
            .values.magneticSurvey.label)
            .toBe('Magnetic survey');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnInterpretationRisk']
            .values.ashDumpAutoLinkBlocked.label)
            .toBe('Ash dump auto-link blocked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryFiringTraceObservation']
            .values.naturalAshGlazeSeparated.label)
            .toBe('Natural ash glaze separated');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnFurnitureContext']
            .values.dedicatedClayObject.label)
            .toBe('Dedicated clay object');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnAnalysisPlan']
            .values.sinteredFloorArchaeomagnetic.label)
            .toBe('Sintered floor archaeomagnetic');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeomagneticSampleContext']
            .values.finalFiringSurfaceCandidate.label)
            .toBe('Final firing surface candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeomagneticSamplingWorkflow']
            .values.gypsumFixed.label)
            .toBe('Gypsum fixed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeomagneticOrientationRecord']
            .values.currentDeclinationRecorded.label)
            .toBe('Current declination recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeomagneticResultQuality']
            .values.l95UnderThree.label)
            .toBe('L95 under 3 degrees');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeomagneticChronologyInterpretation']
            .values.regionalDifferenceConsidered.label)
            .toBe('Regional difference considered');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-archaeomagneticChronologyInterpretation']
            .values.singleDateNotAccepted.label)
            .toBe('단독 확정연대 금지');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnStructureContext'].values.ashDump.label)
            .toBe('Ash dump');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnExcavationControl']
            .values.ashDumpLinkedBaulk.label)
            .toBe('Ash dump linked baulk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnPartInvestigation']
            .values.flueAbsentCaution.label)
            .toBe('Flue absent caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnOperationSequence']
            .values.typeNotDateAlone.label)
            .toBe('Type not date alone');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnFindContext']
            .values.patternByLayerRecorded.label)
            .toBe('Pattern by layer recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tileKilnAnalysisPlan']
            .values.consumerTileComparison.label)
            .toBe('Consumer tile comparison');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-charcoalKilnIdentification']
            .values.sideOpeningCharcoalKilnCandidate.label)
            .toBe('Side-opening charcoal kiln candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-charcoalKilnStructurePart']
            .values.sideOpeningClosureStone.label)
            .toBe('Side-opening closure stone');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-charcoalKilnExcavationControl']
            .values.shortAxisBaulkThreePlus.label)
            .toBe('Three-plus short-axis baulks');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-charcoalKilnTraceInterpretation']
            .values.ceilingGrassTrace.label)
            .toBe('Ceiling grass trace');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-charcoalKilnAnalysisPlan']
            .values.woodSpeciesAnalysis.label)
            .toBe('Wood species analysis');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainKilnSiteSystem']
            .values.clayRefiningPit.label)
            .toBe('Clay refining pit');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainWorkshopProcess']
            .values.glazeSpecialistWorkshop.label)
            .toBe('Glaze specialist workshop');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainKilnStructure']
            .values.bongtongFirebox.label)
            .toBe('Bongtong firebox');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainKilnExcavationControl']
            .values.lowerSlopeFireboxSearch.label)
            .toBe('Lower-slope firebox search');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainFindObservation']
            .values.innerFootRing.label)
            .toBe('Inner foot ring');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainKilnFurnitureContext']
            .values.saggar.label)
            .toBe('Saggar');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-porcelainAnalysisPlan']
            .values.consumerSherdComparison.label)
            .toBe('Consumer sherd comparison');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-porcelainKilnFurnitureContext']
            .values.saggar.label)
            .toBe('갑발');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-charcoalKilnStructurePart']
            .values.sideOpeningClosureStone.label)
            .toBe('측구폐쇄석');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-bronzeAgePotteryTerminology']
            .values.aliasMappingRequired.label)
            .toBe('Alias mapping required');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactDrawingRecordMethod']
            .values.measuredDrawing.label)
            .toBe('Measured drawing');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactDrawingPlan']
            .values.baselineSelected.label)
            .toBe('Baseline selected');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactDrawingQualityCheck']
            .values.measuringPointCheck.label)
            .toBe('Measuring point check');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryDrawingStandard']
            .values.wallThicknessThreeFourPoints.label)
            .toBe('Wall thickness at 3-4 points');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stoneToolDrawingView']
            .values.thirdAngleSixViews.label)
            .toBe('Third-angle six views');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-waterloggedWoodDrawingHandling']
            .values.waterloggedState.label)
            .toBe('Waterlogged state');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-artifactDrawingRecordMethod']
            .values.measuredDrawing.label)
            .toBeDefined();
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-cultivationFeatureContext']
            .values.cropNameNotClassification.label)
            .toBe('작물명으로 논밭 확정 금지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tileKilnFindContext']
            .values.postAbandonmentIntrusion.label)
            .toBe('폐기 후 유입품');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryKilnInterpretationRisk']
            .values.finalOperationNotAssumed.label)
            .toBe('최종 조업품 자동판정 금지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBeDefined();
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-alluvialLayerConceptAudit']
            .values.abLayerSetRecorded.label)
            .toBe('a+b층 세트 기록');
    });
});
