import * as fs from 'fs';
import * as path from 'path';
import { ConfigReader } from '../../src/configuration/boot/config-reader';
import { getConfigurationName, PROJECT_MAPPING } from '../../src/configuration/project-configuration-names';


const SAMPLE_DIR = path.resolve(__dirname, '../../../../docs/korean-fieldwork/samples');


const loadSample = (fileName: string): any => {

    return JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, fileName), 'utf8'));
};


const getSampleForm = (config: any, category: string): any => {

    return config.forms[category] ?? config.forms[`${category}:default`];
};


const expectSampleDocumentsToUseConfiguredFormsAndValuelists = (sample: any, config: any, valuelists: any) => {

    expect(sample.documents.length).toBeGreaterThan(0);

    sample.documents.forEach((document: any) => {
        const resource = document.resource;
        const form = getSampleForm(config, resource.category);

        expect(form).toBeDefined();
        expect(resource.relations).toBeDefined();

        Object.keys(resource).forEach(fieldName => {
            if (!form.valuelists || !form.valuelists[fieldName]) return;

            const valuelist = valuelists[form.valuelists[fieldName]];
            const fieldValues = Array.isArray(resource[fieldName])
                ? resource[fieldName]
                : [resource[fieldName]];

            expect(valuelist).toBeDefined();
            fieldValues.forEach((fieldValue: string) => {
                expect(valuelist.values[fieldValue]).toBeDefined();
            });
        });
    });
};


describe('KoreanFieldwork project configuration', () => {

    it('maps Korean fieldwork project identifiers to the KoreanFieldwork configuration', () => {

        expect(getConfigurationName('korean-fieldwork')).toBe('KoreanFieldwork');
        expect(getConfigurationName('korean-fieldwork-training')).toBe('KoreanFieldwork');
        expect(PROJECT_MAPPING['korean-fieldwork'].prefix).toBe('KoreanFieldwork');
    });


    it('keeps the Korean term authority alias sample aligned with configured forms and valuelists', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('term-authority-alias-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        documents
            .filter((document: any) => document.resource.category !== 'FeatureGroup')
            .forEach((document: any) => {
                const resource = document.resource;
                const parentId = resource.relations.liesWithin[0];
                const parent = documentsById[parentId];

                expect(parent).toBeDefined();
                expect(config.forms[resource.category].parent).toBe(parent.resource.category);
            });

        expect(documentsById['term-alias-dwelling-site-house-place'].resource.relations.liesWithin)
            .toEqual(['term-authority-dwelling-site']);
        expect(documentsById['term-alias-dwelling-site-house-place'].resource.termAliasText)
            .toBe('집자리');
        expect(documentsById['term-alias-dwelling-site-house-place'].resource.termAliasHandling)
            .toContain('doNotOverwriteObservedTerm');
        expect(documentsById['term-authority-dwelling-site'].resource.termSearchMapping)
            .toContain('structureSubtypeSeparated');
        expect(documentsById['term-authority-dwelling-site'].resource.dictionaryEditorialRule)
            .toContain('siteTypeNameSeparated');
        expect(documentsById['term-authority-dwelling-site'].resource.dictionaryEditorialRule)
            .toContain('initialSoundVariantLinked');
        expect(documentsById['term-authority-dwelling-site'].resource.dictionaryEditorialRule)
            .toContain('sameHeadwordDomainSeparated');
        expect(documentsById['term-authority-kiln-site'].resource.termSearchMapping)
            .toContain('doNotMergeToSingleTerm');
        expect(documentsById['term-alias-kiln-site-kiln'].resource.termAliasText)
            .toBe('가마');
        expect(documentsById['term-alias-kiln-site-kiln'].resource.verificationState)
            .toBe('pendingDecision');
        expect(documentsById['term-import-dwelling-site-house-place'].resource.termImportSourceText)
            .toBe('집자리');
        expect(documentsById['term-import-dwelling-site-house-place'].resource.termImportAuthorityText)
            .toBe('주거지');
        expect(documentsById['term-import-kiln-site-gamateo'].resource.termImportReportText)
            .toBe('가마터');
        expect(documentsById['term-import-kiln-site-gamateo'].resource.termSearchMapping)
            .toContain('reportOutputSeparated');
        expect(documentsById['term-alias-open-kiln-handaetgama'].resource.termAliasText)
            .toBe('한뎃가마');
        expect(documentsById['term-alias-open-kiln-handaetgama'].resource.termAliasHandling)
            .toContain('doNotOverwriteObservedTerm');
        expect(documentsById['term-authority-block-sampling'].resource.termDictionaryDomain)
            .toContain('neolithic');
        expect(documentsById['term-alias-block-sampling-bulk'].resource.termAliasText)
            .toContain('Bulk sample');
        expect(documentsById['term-import-block-sampling-lump'].resource.termImportAuthorityText)
            .toBe('블록시료채집법');
        expect(documentsById['term-import-block-sampling-lump'].resource.termAliasHandling)
            .toContain('manualReviewRequired');
        expect(documentsById['term-authority-pottery-workshop'].resource.termSearchMapping)
            .toContain('importMappingNeeded');
        expect(documentsById['term-import-pottery-workshop-subijang'].resource.termImportAuthorityText)
            .toBe('토기 공방');
        expect(documentsById['term-import-pottery-workshop-drying-yard'].resource.verificationState)
            .toBe('pendingDecision');
    });


    it('keeps the Korean field record preservation sample aligned with field-only warning fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('field-record-preservation-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-pit-building-001'].resource.firstExposureRecord)
            .toContain('firstExposurePhoto');
        expect(documentsById['feature-pit-building-001'].resource.fieldOnlyMissingCheck)
            .toContain('notRecoverableWarning');
        expect(documentsById['feature-pit-building-001'].resource.excavationReverseSequenceCheck)
            .toContain('useSurfaceChecked');
        expect(documentsById['segment-pit-building-001-fill-a'].resource.relations.liesWithin)
            .toEqual(['feature-pit-building-001']);
        expect(documentsById['find-pit-building-001-001'].resource.fieldOnlyMissingCheck)
            .toContain('numberedBeforeCollection');
        expect(documentsById['find-pit-building-001-001'].resource.findSampleResearchScope)
            .toContain('futureResearchCandidate');
        expect(documentsById['sample-pit-building-001-charcoal-001'].resource.findSampleResearchScope)
            .toContain('scienceAnalysisCandidate');
        expect(documentsById['sample-pit-building-001-charcoal-001'].resource.sampleCollectionHandling)
            .toContain('contextMapLinked');
        expect(documentsById['photo-pit-building-001-first-exposure'].resource.reportCrossCheck)
            .toContain('photoRegister');
        expect(documentsById['photo-pit-building-001-first-exposure'].resource.photoCaptureSafetyReview)
            .toContain('ladderTopShootingProhibited');
        expect(documentsById['drawing-pit-building-001-plan'].resource.relations.isDepictedIn)
            .toContain('sample-pit-building-001-charcoal-001');
    });


    it('keeps the Korean media drawing and GPS sample aligned with drawing and spatial fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('media-drawing-gps-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['op-media-001'].resource.gpsSurveyQualityRecord)
            .toContain('rtkUsed');
        expect(documentsById['op-media-001'].resource.gpsNmeaRecord)
            .toContain('hdop');
        expect(documentsById['op-media-001'].resource.fieldDatabaseOperationRisk)
            .toContain('dataCompatibilityChecked');
        expect(documentsById['op-media-001'].resource.fieldDatabaseOperationRisk)
            .toContain('siteSearchTested');
        expect(documentsById['op-media-001'].resource.digitalSurveyQualityControl)
            .toContain('fieldResultCrossChecked');
        expect(documentsById['photo-media-gps-001'].resource.gpsPhotoLinkRecord)
            .toContain('currentPositionLinked');
        expect(documentsById['photo-media-gps-001'].resource.mediaQualityCheck)
            .toContain('preRecoveryPhotoTaken');
        expect(documentsById['photo-media-gps-001'].resource.mediaQualityCheck)
            .toContain('levelingLinkedForRecovery');
        expect(documentsById['photo-media-gps-001'].resource.mediaQualityCheck)
            .toContain('findNumberLocationMatched');
        expect(documentsById['drawing-media-distribution-001'].resource.mapSourceMaterial)
            .toContain('joseonMap');
        expect(documentsById['drawing-media-distribution-001'].resource.distributionMapRequirement)
            .toContain('radius500m');
        expect(documentsById['drawing-media-pottery-001'].resource.potteryDrawingStandard)
            .toContain('wallThicknessThreeFourPoints');
        expect(documentsById['drawing-media-stone-tool-001'].resource.stoneToolDrawingView)
            .toContain('thirdAngleSixViews');
        expect(documentsById['drawing-media-waterlogged-wood-001'].resource.waterloggedWoodDrawingHandling)
            .toContain('waterloggedState');
        expect(documentsById['drawing-media-3d-source-001'].resource.electronicDrawingSourceWorkflow)
            .toContain('pointCloudMerged');
        expect(documentsById['drawing-media-3d-source-001'].resource.artifactElectronicDrawingProcedure)
            .toContain('referencePlaneCreated');
    });


    it('keeps the Korean public research governance sample aligned with release and role fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('public-research-governance-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['project-public-research-001'].resource.publicArchaeologyOutput)
            .toContain('onlineArchive');
        expect(documentsById['project-public-research-001'].resource.accessControlTag)
            .toContain('lootingRisk');
        expect(documentsById['project-public-research-001'].resource.overseasHeritageRisk)
            .toContain('exportRestriction');
        expect(documentsById['project-public-research-001'].resource.koreanArchaeologyInstitutionalRisk)
            .toContain('scientificAnalysisExcluded');
        expect(documentsById['project-public-research-001'].resource.researchProcessBalance)
            .toContain('interpretationImpactReviewed');
        expect(documentsById['op-public-briefing-001'].resource.publicEngagementProgram)
            .toContain('mockExcavationUsed');
        expect(documentsById['op-public-briefing-001'].resource.experimentDesign)
            .toContain('singleRunWarning');
        expect(documentsById['photo-public-briefing-001'].resource.mediaRights)
            .toContain('sensitiveDetailMasked');
        expect(documentsById['drawing-public-3d-001'].resource.accessControlTag)
            .toContain('reviewBeforeRelease');
    });


    it('keeps the Korean daily log and quality review sample aligned with review fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('daily-log-quality-review-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['op-quality-001'].resource.personalNotebookArchive)
            .toContain('originalSubmitted');
        expect(documentsById['op-quality-001'].resource.reportEvaluationFeedback)
            .toContain('fieldQualityNotSubstituted');
        expect(documentsById['op-quality-001'].resource.operationRoleResponsibility)
            .toContain('safetyLead');
        expect(documentsById['op-quality-001'].resource.operationRoleResponsibility)
            .toContain('roleGapIdentified');
        expect(documentsById['op-quality-001'].resource.excavationControlSafety)
            .toContain('machineStrippingDepthControlled');
        expect(documentsById['op-quality-001'].resource.excavationControlSafety)
            .toContain('spoilStockpileHaulagePlanned');
        expect(documentsById['op-quality-001'].resource.excavationControlSafety)
            .toContain('sameDaySectionPhotoDrawing');
        expect(documentsById['op-quality-001'].resource.digitalSourcePreservation)
            .toContain('unpublishedDrawingRetained');
        expect(documentsById['op-quality-001'].resource.digitalSourcePreservation)
            .toContain('physicalFindAccessRecorded');
        expect(documentsById['op-quality-001'].resource.digitalSourcePreservation)
            .toContain('followUpResearcherAccessLogged');
        expect(documentsById['daily-log-quality-001'].resource.relations.liesWithin)
            .toEqual(['op-quality-001']);
        expect(documentsById['daily-log-quality-001'].resource.dailyLogEvidenceRole)
            .toContain('disputeEvidencePotential');
        expect(documentsById['daily-log-quality-001'].resource.operationRoleResponsibility)
            .toContain('dailyLogAuthor');
        expect(documentsById['daily-log-quality-001'].resource.dailyLogReview)
            .toContain('sourceRecordArchived');
        expect(documentsById['quality-review-sameday-001'].resource.relations.liesWithin)
            .toEqual(['op-quality-001']);
        expect(documentsById['quality-review-sameday-001'].resource.reviewedRecordUnit)
            .toContain('personalNotebook');
        expect(documentsById['quality-review-sameday-001'].resource.qualityReviewStage)
            .toContain('sourceRecordCorrection');
        expect(documentsById['quality-review-sameday-001'].resource.qualityCorrectionBasis)
            .toContain('noSilentRewrite');
        expect(documentsById['quality-review-sameday-001'].resource.reportEvaluationFeedback)
            .toContain('supplementRequestTracked');
    });


    it('keeps the Korean source evidence index sample aligned with source verification fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('source-evidence-index-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['source-index-fortification-001'].resource.relations.liesWithin)
            .toEqual(['project-source-evidence-001']);
        expect(documentsById['source-index-fortification-001'].resource.sourceEvidenceCitation)
            .toContain('한국 매장문화재 조사연구방법론7');
        expect(documentsById['source-index-fortification-001'].resource.sourceEvidenceLocator)
            .toContain('원PDF 도판');
        expect(documentsById['source-index-fortification-001'].resource.sourceEvidenceMaterial)
            .toContain('measurementValue');
        expect(documentsById['source-index-fortification-001'].resource.sourceEvidenceUse)
            .toContain('preventAutoClassification');
        expect(documentsById['source-index-alluvial-neolithic-001'].resource.sourceEvidenceDomain)
            .toContain('alluvialSite');
        expect(documentsById['source-index-alluvial-neolithic-001'].resource.sourceEvidenceVerification)
            .toContain('directPdfChecked');
        expect(documentsById['source-index-alluvial-soilmap-001'].resource.sourceEvidenceLocator)
            .toContain('PDF 497-525');
        expect(documentsById['source-index-alluvial-soilmap-001'].resource.sourceEvidenceDomain)
            .toContain('fieldSurvey');
        expect(documentsById['source-index-alluvial-soilmap-001'].resource.sourceEvidenceUse)
            .toContain('preventAutoClassification');
        expect(documentsById['source-index-archaeobotany-001'].resource.sourceEvidenceDomain)
            .toContain('archaeobotany');
        expect(documentsById['source-index-archaeobotany-001'].resource.sourceEvidenceUse)
            .toContain('sampleValidationEvidence');
        expect(documentsById['source-index-artifact-storage-001'].resource.sourceEvidenceLocator)
            .toContain('PDF 309-313');
        expect(documentsById['source-index-artifact-storage-001'].resource.sourceEvidenceDomain)
            .toContain('conservationScience');
        expect(documentsById['source-index-artifact-storage-001'].resource.sourceEvidenceUse)
            .toContain('metricReference');
        expect(documentsById['source-index-faunal-quantification-001'].resource.sourceEvidenceDomain)
            .toContain('zooarchaeology');
        expect(documentsById['source-index-faunal-quantification-001'].resource.sourceEvidenceUse)
            .toContain('analysisPlanEvidence');
        expect(documentsById['source-index-faunal-quantification-001'].resource.sourceEvidenceVerification)
            .toContain('crossSourceCompared');
        expect(documentsById['source-index-pit-dwelling-001'].resource.sourceEvidenceDomain)
            .toContain('buildingSite');
        expect(documentsById['source-index-pit-dwelling-001'].resource.sourceEvidenceVerification)
            .toContain('captionNeedsCheck');
        expect(documentsById['source-index-pit-dwelling-001'].resource.sourceEvidenceUse)
            .toContain('preventAutoClassification');
        expect(documentsById['source-index-stratigraphy-context-001'].resource.sourceEvidenceDomain)
            .toContain('reportWriting');
        expect(documentsById['source-index-stratigraphy-context-001'].resource.sourceEvidenceUse)
            .toContain('reportCrossCheckEvidence');
        expect(documentsById['source-index-stratigraphy-context-001'].resource.sourceEvidenceVerification)
            .toContain('ocrCorrectionNeeded');
        expect(documentsById['source-index-dictionary-001'].resource.sourceEvidenceMaterial)
            .toContain('originalScript');
        expect(documentsById['source-index-dictionary-001'].resource.sourceEvidenceVerification)
            .toContain('ocrCorrectionNeeded');
    });


    it('keeps the Korean investigation stage transition sample aligned with handover fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('stage-transition-handover-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['project-stage-transition-001'].resource.investigationRecordHandover)
            .toContain('fullExcavationTransition');
        expect(documentsById['survey-surface-001'].resource.surfaceSurveyFollowUp)
            .toContain('testExcavation');
        expect(documentsById['survey-trial-001'].resource.sampleSurveySuitability)
            .toContain('betweenTrenchesUncertain');
        expect(documentsById['survey-trial-001'].resource.trialTrenchDesign)
            .toContain('naturalLeveeRiverPerpendicular');
        expect(documentsById['survey-trial-001'].resource.excavationScopeDifficultyBasis)
            .toContain('scopeChangeHistory');
        expect(documentsById['op-handover-001'].resource.investigationRecordHandover)
            .toContain('handoverConfirmed');
    });


    it('keeps the Korean administrative workflow sample aligned with review package fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('administrative-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['project-admin-workflow-001'].resource.investigationRequestIntake)
            .toContain('projectOwnerBasicData');
        expect(documentsById['project-admin-workflow-001'].resource.investigationPlanChangeRecord)
            .toContain('permitChangeNeeded');
        expect(documentsById['permit-document-admin-001'].resource.excavationPermitDocumentSet)
            .toContain('excavationPermitApplication');
        expect(documentsById['permit-document-admin-001'].resource.excavationPermitDocumentSet)
            .toContain('undergroundExcavationPlanAttached');
        expect(documentsById['permit-document-admin-001'].resource.permitDocumentReferenceText)
            .toContain('사업계획 평면도');
        expect(documentsById['project-admin-workflow-001'].resource.expertReviewMeeting)
            .toContain('divergentOpinionPreserved');
        expect(documentsById['project-admin-workflow-001'].resource.partialCompletionPackage)
            .toContain('remainingUninvestigatedArea');
        expect(documentsById['project-admin-workflow-001'].resource.recordTransferManagementSystem)
            .toContain('sourceDatabase');
        expect(documentsById['report-submission-admin-001'].resource.reportSubmissionWorkflow)
            .toContain('submissionReceiptRecorded');
        expect(documentsById['report-submission-admin-001'].resource.reportSourceLinkText)
            .toContain('번호 변환표');
        expect(documentsById['report-preparation-admin-001'].resource.reportPreparationReview)
            .toContain('legendPrepared');
        expect(documentsById['report-preparation-admin-001'].resource.reportPreparationReview)
            .toContain('drawingPhotoConsistencyChecked');
        expect(documentsById['report-preparation-admin-001'].resource.reportPreparationStandardText)
            .toContain('방위');
        expect(documentsById['report-standard-history-admin-001'].resource.reportStandardHistory)
            .toContain('standardChanged');
        expect(documentsById['report-standard-history-admin-001'].resource.reportStandardHistory)
            .toContain('artifactNumberRuleRecorded');
        expect(documentsById['report-standard-history-admin-001'].resource.reportStandardChangeReasonText)
            .toContain('유구번호 변동표');
        expect(documentsById['information-asset-admin-001'].resource.informationAssetType)
            .toContain('standardElectronicExcavationReport');
        expect(documentsById['information-asset-admin-001'].resource.informationAssetType)
            .toContain('surfaceSurveyGis');
        expect(documentsById['information-asset-admin-001'].resource.informationAssetManagement)
            .toContain('backupVerified');
        expect(documentsById['information-asset-admin-001'].resource.informationAssetLinkText)
            .toContain('사진대장');
        expect(documentsById['state-vesting-admin-001'].resource.stateVestingSelectionRecord)
            .toContain('stateVestingRegister');
        expect(documentsById['state-vesting-admin-001'].resource.stateVestingReceiptText)
            .toContain('임시보관증');
        expect(documentsById['op-admin-review-001'].resource.partialCompletionPackage)
            .toContain('notificationResult');
        expect(documentsById['op-admin-review-001'].resource.siteProtectionSecurity)
            .toContain('permitDocumentOnSite');
        expect(documentsById['op-admin-review-001'].resource.siteProtectionSecurity)
            .toContain('temporaryFindStorage');
        expect(documentsById['survey-admin-surface-001'].resource.surfaceSurveyResultProcessing)
            .toContain('digitalRegistration');
    });


    it('keeps the Korean surface survey scope and absence sample aligned with Survey fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('surface-survey-scope-absence-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyScopeDefinition)
            .toContain('temporaryRoad');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyMapRequirement)
            .toContain('absoluteCoordinatesRecorded');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyHeritageCategory)
            .toContain('modernHeritage');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyTimingReview)
            .toContain('preservationReviewTimeSecured');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyFieldDiary)
            .toContain('informantContactRecorded');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceSurveyFieldDiary)
            .toContain('permanentMarkerRecord');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceEvidenceAbsenceAssessment)
            .toContain('noSurfaceEvidence');
        expect(documentsById['survey-surface-scope-001'].resource.surfaceEvidenceAbsenceAssessment)
            .toContain('additionalSurveyNeeded');
        expect(documentsById['survey-surface-scope-001'].resource.nonSiteResourceSurvey)
            .toContain('dolmenStoneSource');
        expect(documentsById['find-surface-pottery-001'].resource.relations.liesWithin)
            .toEqual(['survey-surface-scope-001']);
        expect(documentsById['find-surface-pottery-001'].resource.surfaceFindHandlingRecord)
            .toContain('gpsLatLongRecorded');
        expect(documentsById['find-surface-pottery-001'].resource.surfaceFindHandlingRecord)
            .toContain('adheringSoilPreserved');
    });


    it('keeps the Korean Paleolithic survey sample aligned with Survey fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('paleolithic-survey-lithic-context-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicSurveyStage)
            .toContain('trialPitSurvey');
        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicLocationSource)
            .toContain('paleosolLayer');
        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicFieldCollection)
            .toContain('oneKgSoilSample');
        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicTrialPitCoordinateControl)
            .toContain('candidateLithicImmediateCheck');
        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicProfileSampleRecord)
            .toContain('duplicateSample');
        expect(documentsById['survey-paleolithic-terrace-001'].resource.paleolithicNonSiteResourceSurvey)
            .toContain('nearbyStoneSource');
        expect(documentsById['feature-paleolithic-lithic-cluster-001'].resource.paleolithicLithicSpatialContext)
            .toContain('microDebitageWaterSieved');
        expect(documentsById['feature-paleolithic-lithic-cluster-001'].resource.paleolithicLithicSpatialContext)
            .toContain('machineStrippingStoppedAfterFind');
        expect(documentsById['segment-paleolithic-cultural-layer-001'].resource.relations.liesWithin)
            .toEqual(['feature-paleolithic-lithic-cluster-001']);
        expect(documentsById['segment-paleolithic-cultural-layer-001'].resource.paleolithicCulturalLayerReview)
            .toContain('naturalCulturalMismatchChecked');
        expect(documentsById['segment-paleolithic-cultural-layer-001'].resource.paleolithicCulturalLayerReview)
            .toContain('refittedAcrossLayersChecked');
        expect(documentsById['find-paleolithic-candidate-lithic-001'].resource.relations.liesWithin)
            .toEqual(['survey-paleolithic-terrace-001']);
        expect(documentsById['find-paleolithic-candidate-lithic-001'].resource.artifactLabelRegisterLink)
            .toContain('coordinateEastWestRecorded');
    });


    it('keeps the Korean artifact label-register sample aligned with Find fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('artifact-label-register-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['find-artifact-label-001'].resource.artifactLabelRegisterLink)
            .toContain('labelCreated');
        expect(documentsById['find-artifact-label-001'].resource.artifactLabelRegisterLink)
            .toContain('fieldSerialInventoryNumberLinked');
        expect(documentsById['find-artifact-label-001'].resource.artifactLabelRegisterLink)
            .toContain('uniqueRegistrationNumberMarked');
        expect(documentsById['find-artifact-label-001'].resource.relations.isRecordedIn)
            .toEqual(['op-artifact-register-001']);
    });


    it('keeps the Korean faunal recovery sample aligned with Sample fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('faunal-recovery-quantification-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['sample-shell-midden-fauna-001'].resource.relations.liesWithin)
            .toEqual(['feature-shell-midden-001']);
        expect(documentsById['sample-shell-midden-fauna-001'].resource.shellMiddenSamplingStrategy)
            .toContain('fishBoneSeparated');
        expect(documentsById['sample-shell-midden-fauna-001'].resource.faunalRecoverySampling)
            .toContain('smallMaterialTargeted');
        expect(documentsById['sample-shell-midden-fauna-001'].resource.boneSurfaceModification)
            .toContain('modificationCauseUnresolved');
        expect(documentsById['sample-shell-midden-fauna-001'].resource.zooarchaeologicalQuantification)
            .toContain('singleIndexNotUsed');
        expect(documentsById['feature-shell-midden-001'].resource.shellMiddenStratigraphy)
            .toContain('redepositionChecked');
    });


    it('keeps the Korean iron production sample aligned with process and residue fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('iron-production-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-iron-furnace-001'].resource.ironProcessEvidence)
            .toContain('alternativeProcessOpen');
        expect(documentsById['feature-iron-furnace-001'].resource.ironFurnaceStructure)
            .toContain('floorNotConfusedWithCut');
        expect(documentsById['iron-process-relation-001'].resource.ironPreviousOutputText)
            .toBe('환원괴·반환원괴 후보');
        expect(documentsById['iron-process-relation-001'].resource.ironNextInputText)
            .toBe('단야 원료 철소재 후보');
        expect(documentsById['iron-process-relation-001'].resource.ironProcessRelationCheck)
            .toContain('analysisFeedbackNeeded');
        expect(documentsById['find-iron-residue-001'].resource.ironResidueSubtype)
            .toContain('furnaceInternalSlag');
        expect(documentsById['find-iron-residue-001'].resource.ironResidueSubtype)
            .toContain('sphericalHammerscale');
        expect(documentsById['sample-iron-analysis-001'].resource.ironSampleAnalysisPlan)
            .toContain('oxideConversion');
        expect(documentsById['sample-iron-analysis-001'].resource.ironSampleAnalysisPlan)
            .toContain('destructiveApproval');
    });


    it('keeps the Korean tomb burial sample aligned with mound, goods, and remains fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('tomb-burial-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-tomb-mound-001'].resource.tombMoundInvestigation)
            .toContain('moundConstructionSequence');
        expect(documentsById['feature-tomb-mound-001'].resource.tombBurialStructureInvestigation)
            .toContain('additionalBurialEvidence');
        expect(documentsById['feature-tomb-mound-001'].resource.tombSurveyPurpose)
            .toContain('scheduleBudgetConstraint');
        expect(documentsById['feature-tomb-mound-001'].resource.moundTrenchInvestigation)
            .toContain('crossTrench');
        expect(documentsById['feature-tomb-mound-001'].resource.moundTrenchInvestigation)
            .toContain('partialInformationCaution');
        expect(documentsById['feature-tomb-mound-001'].resource.moundFillSubdivisionRecord)
            .toContain('labMergePossible');
        expect(documentsById['feature-tomb-mound-001'].resource.tombMoundOverlapSequence)
            .toContain('latestBurialExposedFirst');
        expect(documentsById['feature-tomb-mound-001'].resource.tombMoundOverlapSequence)
            .toContain('sameOrderPhotoSequence');
        expect(documentsById['feature-tomb-mound-001'].resource.tombMoundOverlapSequence)
            .toContain('sharedDitchSequenceChecked');
        expect(documentsById['feature-tomb-mound-001'].resource.stoneCistWallPackingRecord)
            .toContain('plasterClayRemaining');
        expect(documentsById['feature-tomb-mound-001'].resource.tombInteriorRecoveryRecord)
            .toContain('laboratorySeparationPlanned');
        expect(documentsById['feature-tomb-mound-001'].resource.stoneChamberTombTypology)
            .toContain('typeNamePending');
        expect(documentsById['feature-tomb-mound-001'].resource.tombPassageClosureSequence)
            .toContain('sequenceComparedWithBurial');
        expect(documentsById['feature-tomb-mound-001'].resource.burialPlatformUseSequence)
            .toContain('removalReverseSequence');
        expect(documentsById['feature-tomb-mound-001'].resource.tombRitualDepositRecord)
            .toContain('constructionStageLinked');
        expect(documentsById['feature-tomb-mound-001'].resource.tombRitualDepositRecord)
            .toContain('inSituPreservationDuringMoundWork');
        expect(documentsById['find-tomb-grave-good-001'].resource.graveGoodsRitualContext)
            .toContain('functionNotAssumed');
        expect(documentsById['find-tomb-grave-good-001'].resource.graveGoodsRitualContext)
            .toContain('relationToHumanRemains');
        expect(documentsById['sample-tomb-human-remains-001'].resource.humanRemainsRecoveryAnalysis)
            .toContain('dnaBeforeTreatment');
        expect(documentsById['sample-tomb-human-remains-001'].resource.humanRemainsRecoveryAnalysis)
            .toContain('analysisCriteriaRecorded');
    });


    it('keeps the Korean Bronze Age settlement sample aligned with dwelling, dolmen, and pottery fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('bronze-age-settlement-dolmen-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['fg-bronze-settlement-001'].resource.featurePackage)
            .toContain('pitDwelling');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitFeatureFunctionAssessment)
            .toContain('functionNotAssumed');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitBuildingLifecycleStage)
            .toContain('reuse');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitDwellingInvestigationSequence)
            .toContain('samePhotoStationMaintained');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitDwellingInvestigationSequence)
            .toContain('thirdExposureRecorded');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitDwellingSectionStrategy)
            .toContain('exploratoryTrenchRationale');
        expect(documentsById['feature-bronze-dwelling-001'].resource.pitDwellingSectionStrategy)
            .toContain('partialInformationRiskRecorded');
        expect(documentsById['feature-bronze-dwelling-001'].resource.settlementFeatureInvestigationProcedure)
            .toContain('floorInvestigation');
        expect(documentsById['feature-bronze-dwelling-001'].resource.settlementFeatureTrenchStrategy)
            .toContain('drawingInversionRisk');
        expect(documentsById['feature-bronze-dwelling-001'].resource.bronzeAgeDwellingEvidence)
            .toContain('songgukriTypeCandidate');
        expect(documentsById['feature-bronze-dwelling-001'].resource.bronzeAgeDwellingEvidence)
            .toContain('typeNameNotAssumed');
        expect(documentsById['feature-bronze-dwelling-001'].resource.interpretationArgument)
            .toContain('alternativeInterpretationRecorded');
        expect(documentsById['sample-bronze-dwelling-science-001'].resource.pitDwellingScienceSamplingPlan)
            .toContain('postExcavationCleaningAvoided');
        expect(documentsById['sample-bronze-dwelling-science-001'].resource.pitDwellingScienceSamplingPlan)
            .toContain('postInvestigationSampling');
        expect(documentsById['sample-bronze-dwelling-science-001'].resource.pitDwellingScienceSamplingPlan)
            .toContain('contaminationRiskChecked');
        expect(documentsById['feature-bronze-dolmen-001'].resource.dolmenStructureContext)
            .toContain('laterGraveMarkerReuse');
        expect(documentsById['feature-bronze-enclosure-001'].resource.bronzeAgeEnclosureInterpretation)
            .toContain('drainageCollectionCandidate');
        expect(documentsById['feature-bronze-enclosure-001'].resource.bronzeAgeEnclosureInterpretation)
            .toContain('naturalSedimentChecked');
        expect(documentsById['find-bronze-pottery-001'].resource.bronzeAgePotteryTerminology)
            .toContain('minmunTerminologyAlias');
        expect(documentsById['find-bronze-pottery-001'].resource.bronzeAgePotteryTerminology)
            .toContain('contextNotStyleOnly');
        expect(documentsById['find-bronze-pottery-001'].resource.chronologyArgument)
            .toContain('regionalLagRisk');
        expect(documentsById['find-bronze-pottery-001'].resource.interpretationArgument)
            .toContain('analysisResultImpactReviewed');
    });


    it('keeps the Korean building-site posthole and foundation sample aligned with building fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('building-site-posthole-foundation-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-surface-building-001'].resource.featurePackage)
            .toContain('buildingSite');
        expect(documentsById['feature-surface-building-001'].resource.surfaceBuildingJudgement)
            .toContain('raisedFloorBuildingCandidate');
        expect(documentsById['feature-surface-building-001'].resource.surfaceBuildingJudgement)
            .toContain('reconstructionEvidenceSeparated');
        expect(documentsById['feature-surface-building-001'].resource.postholeGroupSurvey)
            .toContain('oneBayOutsideIncluded');
        expect(documentsById['feature-surface-building-001'].resource.postholeGroupSurvey)
            .toContain('baySpacingChecked');
        expect(documentsById['feature-surface-building-001'].resource.foundationTraceRecord)
            .toContain('cornerstoneExtractionPit');
        expect(documentsById['feature-surface-building-001'].resource.foundationTraceRecord)
            .toContain('postholeIndependentFoundationCheck');
        expect(documentsById['feature-surface-building-001'].resource.buildingExpertReview)
            .toContain('reconstructionHypothesisSeparated');
        expect(documentsById['feature-surface-building-001'].resource.buildingExpertReview)
            .toContain('expertReviewNeeded');
        expect(documentsById['feature-surface-building-001'].resource.buildingReconstructionEvidence)
            .toContain('yeongjocheokCandidate');
        expect(documentsById['feature-surface-building-001'].resource.buildingReconstructionEvidence)
            .toContain('originalAndHypothesisSeparated');
        expect(documentsById['feature-surface-building-001'].resource.buildingProspectionConservationRecord)
            .toContain('registrationErrorRecorded');
        expect(documentsById['feature-surface-building-001'].resource.buildingProspectionConservationRecord)
            .toContain('restorationDeferred');
    });


    it('keeps the Korean fortification facility sample aligned with facility fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('fortification-facility-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-fortification-gate-001'].resource.fortificationGateFacility)
            .toContain('janggungseok');
        expect(documentsById['feature-fortification-gate-001'].resource.fortificationHiddenGateFunction)
            .toContain('counterattackRoute');
        expect(documentsById['feature-fortification-gate-001'].resource.fortificationParapetDetail)
            .toContain('defenderCount');
        expect(documentsById['feature-fortification-water-001'].resource.fortificationWaterFacility)
            .toContain('collapseRepairHistory');
        expect(documentsById['feature-japanese-ditch-001'].resource.japaneseFortificationDitch)
            .toContain('horizontalMovementRestriction');
        expect(documentsById['feature-japanese-ditch-001'].resource.japaneseFortificationDitch)
            .toContain('interFortressLink');
        expect(documentsById['feature-beacon-001'].resource.beaconPhysicalFacility)
            .toContain('combustionChamber');
        expect(documentsById['feature-beacon-001'].resource.beaconNetworkOperation)
            .toContain('counterpartBeacon');
        expect(documentsById['feature-beacon-001'].resource.fortressBeaconRelation)
            .toContain('physicalOperationSeparated');
    });


    it('keeps the Korean fortification construction and restoration sample aligned with evidence fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('fortification-construction-restoration-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-rampart-construction-001'].resource.fortificationConstructionEvidence)
            .toContain('similarPanchukCaution');
        expect(documentsById['feature-rampart-construction-001'].resource.fortificationConstructionEvidence)
            .toContain('panBlockJointRecorded');
        expect(documentsById['feature-rampart-construction-001'].resource.fortificationFoundationRecord)
            .toContain('foundationBeforeWallBody');
        expect(documentsById['feature-fortification-repair-001'].resource.fortificationRepairRecord)
            .toContain('collapsedStoneInventory');
        expect(documentsById['feature-fortification-repair-001'].resource.fortificationRepairRecord)
            .toContain('repairReportRequired');
        expect(documentsById['feature-fortification-repair-001'].resource.fortificationRestorationEvidence)
            .toContain('yongcheokCandidate');
        expect(documentsById['feature-fortification-repair-001'].resource.fortificationRestorationEvidence)
            .toContain('onsiteConservationPriority');
    });


    it('keeps the Korean pottery technology and Neolithic subsistence sample aligned with Find fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('pottery-technology-subsistence-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['find-neolithic-pottery-001'].resource.ceramicTermScope)
            .toContain('firingTemperatureCandidate');
        expect(documentsById['find-neolithic-pottery-001'].resource.potteryFabricTemperRecord)
            .toContain('plantFiberTemper');
        expect(documentsById['find-neolithic-pottery-001'].resource.potteryTemperFunctionAssessment)
            .toContain('porosityControl');
        expect(documentsById['find-neolithic-pottery-001'].resource.potteryProductionLifeRecord)
            .toContain('fabricPreparation');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryFormingTraceAssessment)
            .toContain('stringCutTrace');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryFormingCaution)
            .toContain('stringCutNotStandalone');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryProcessDirectionality)
            .toContain('magnifiedPhoto');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryProductionOrganizationEvidence)
            .toContain('ethnographicDirectEquationBlocked');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryComparativeReferenceCheck)
            .toContain('hastyConclusionBlocked');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryExperimentalVariableRecord)
            .toContain('failureTrace');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryClassificationBasis)
            .toContain('technicalGroupSorted');
        expect(documentsById['find-pottery-forming-trace-001'].resource.potteryProvenanceDistributionReview)
            .toContain('workshopAttributionUncertain');
        expect(documentsById['find-neolithic-fishing-gear-001'].resource.neolithicSubsistenceEvidence)
            .toContain('functionNotAssumed');
        expect(documentsById['find-neolithic-fishing-gear-001'].resource.neolithicSubsistenceEvidence)
            .toContain('fishCurrentSeasonality');
    });


    it('keeps the Korean archaeobotany flotation sample aligned with Sample fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('archaeobotany-flotation-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['sample-archaeobotany-flotation-001'].resource.sampleCollectionHandling)
            .toContain('carbonizedGrainSeparate');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.archaeobotanySampleDesign)
            .toContain('researchQuestionSelected');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.archaeobotanySampleDesign)
            .toContain('sampleCountPrioritized');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainSamplingMethod)
            .toContain('unanalyzedArea');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainSamplingMethod)
            .toContain('systematicSample');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.flotationProcessingRecord)
            .toContain('preProcessingSoilAmount');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.flotationProcessingRecord)
            .toContain('lightFractionAfterProcessing');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainIdentificationRecord)
            .toContain('modernComparativeSpecimen');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainIdentificationRecord)
            .toContain('identificationConfidence');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainIdentificationRecord)
            .toContain('semPhoto');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.archaeobotanyInterpretationReview)
            .toContain('analyticalResultSeparated');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.archaeobotanyInterpretationReview)
            .toContain('cropMorphologyChange');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainNonDetectionAssessment)
            .toContain('absenceNotAssumed');
        expect(documentsById['sample-archaeobotany-flotation-001'].resource.plantRemainNonDetectionAssessment)
            .toContain('pollenPreservationFragile');
    });


    it('keeps the Korean alluvial landform and layer sample aligned with survey and layer fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('alluvial-landform-layer-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['survey-alluvial-001'].resource.alluvialLandformSurvey)
            .toContain('noSurfaceFindsNotAbsence');
        expect(documentsById['survey-alluvial-001'].resource.soilMapPredictionVerification)
            .toContain('soilMapDepthLimitChecked');
        expect(documentsById['segment-alluvial-profile-ia'].resource.alluvialLayerConceptAudit)
            .toContain('abLayerSetRecorded');
        expect(documentsById['segment-alluvial-profile-ia'].resource.alluvialSurfaceAttribution)
            .toContain('soilFormationLoweredDetection');
        expect(documentsById['segment-alluvial-profile-ia'].resource.alluvialFormationProcess)
            .toContain('heterogeneousSoilBlock');
        expect(documentsById['feature-alluvial-cultivation-001'].resource.cultivationFeatureContext)
            .toContain('cropNameNotClassification');
        expect(documentsById['feature-alluvial-cultivation-001'].resource.cultivationFeatureEvidence)
            .toContain('notAbsoluteCriterion');
        expect(documentsById['sample-alluvial-phytolith-001'].resource.paleoenvironmentProxySampling)
            .toContain('plantOpalSample');
        expect(documentsById['sample-alluvial-phytolith-001'].resource.plantRemainNonDetectionAssessment)
            .toContain('absenceNotAssumed');
    });


    it('keeps the Korean stratigraphy lifecycle sample aligned with FeatureSegment fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('stratigraphy-feature-lifecycle-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicObservationProcedure)
            .toContain('repeatedObservation');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicObservationProcedure)
            .toContain('overallStratigraphyFlowPrepared');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.layerNamingSystem)
            .toContain('changeHistory');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.soilTextureFieldAssessment)
            .toContain('quantitativeAnalysisNeeded');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.featureFillInterpretation)
            .toContain('attributionCaution');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.naturalHumusRelativity)
            .toContain('targetPeriodChecked');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.featureLifecycleReview)
            .toContain('burialProcess');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.featureLifecycleReview)
            .toContain('findLayerRelationRecorded');
        expect(documentsById['op-stratigraphy-lifecycle-001'].resource.reportCrossCheck)
            .toContain('layerFindContextConsistency');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.featureBlockInclusionAssessment)
            .toContain('baseLayerDerived');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.featureBurialProcessAssessment)
            .toContain('soilFormationTrace');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicRelationReview)
            .toContain('baulkRemovalCrossCheck');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicRelationReview)
            .toContain('relationChangeReasonRecorded');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicRelationReview)
            .toContain('mediaCrossChecked');
        expect(documentsById['feature-stratigraphy-pit-001'].resource.excavationContextModel)
            .toContain('investigationMethodRationale');
        expect(documentsById['feature-stratigraphy-pit-001'].resource.excavationContextModel)
            .toContain('rescueExcavation');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.stratigraphicMisreadGuard)
            .toContain('btBandCandidate');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.faciesSectionDrawingRecord)
            .toContain('boundaryLineConventionApplied');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.termSearchMapping)
            .toContain('doNotMergeToSingleTerm');
        expect(documentsById['segment-stratigraphy-fill-001'].resource.chronologyArgument)
            .toContain('heirloomOrReuseRisk');
    });


    it('keeps the Korean wetland survey sample aligned with microtopography fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('wetland-survey-microtopography-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['survey-wetland-001'].resource.wetlandAnalysisSource)
            .toContain('boringDataLinked');
        expect(documentsById['survey-wetland-001'].resource.wetlandLandformInterpretation)
            .toContain('ultraMicroLandformAnalysis');
        expect(documentsById['survey-wetland-001'].resource.wetlandSurveyTargeting)
            .toContain('trialTrenchPointSelected');
        expect(documentsById['segment-wetland-backswamp-001'].resource.wetlandMicrotopographyRecord)
            .toContain('buriedPaddySoil');
        expect(documentsById['segment-wetland-backswamp-001'].resource.wetlandMicrotopographyRecord)
            .toContain('diatomAnalysisLinked');
        expect(documentsById['sample-wetland-proxy-001'].resource.paleoenvironmentProxySampling)
            .toContain('diatomSample');
        expect(documentsById['sample-wetland-proxy-001'].resource.sampleCollectionHandling)
            .toContain('waterloggedMoistKept');
    });


    it('keeps the Korean ceramic kiln production sample aligned with kiln fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('ceramic-kiln-production-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-pottery-kiln-001'].resource.potteryKilnYardFacility)
            .toContain('formingArea');
        expect(documentsById['feature-pottery-kiln-001'].resource.potteryKilnOperationScale)
            .toContain('productionQuantityNotAssumed');
        expect(documentsById['feature-pottery-kiln-001'].resource.potteryKilnInterpretationRisk)
            .toContain('ashDumpAutoLinkBlocked');
        expect(documentsById['find-pottery-firing-trace-001'].resource.potteryKilnFurnitureContext)
            .toContain('findLinkedToSurfaceTrace');
        expect(documentsById['sample-pottery-kiln-001'].resource.potteryKilnAnalysisPlan)
            .toContain('multipleDatingMethodsCompared');
        expect(documentsById['feature-tile-kiln-001'].resource.tileKilnExcavationControl)
            .toContain('ashDumpLinkedBaulk');
        expect(documentsById['find-tile-kiln-001'].resource.tileKilnFindContext)
            .toContain('patternByLayerRecorded');
        expect(documentsById['sample-tile-kiln-001'].resource.tileKilnAnalysisPlan)
            .toContain('consumerTileComparison');
        expect(documentsById['feature-porcelain-kiln-001'].resource.porcelainKilnSiteSystem)
            .toContain('consumerSiteComparison');
        expect(documentsById['find-porcelain-kiln-001'].resource.porcelainKilnFurnitureContext)
            .toContain('individualFiringCaution');
        expect(documentsById['sample-porcelain-kiln-001'].resource.porcelainAnalysisPlan)
            .toContain('provenanceComparison');
    });


    it('keeps the Korean charcoal kiln archaeomagnetic sample aligned with kiln and sample fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('charcoal-kiln-archaeomagnetic-workflow-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['feature-charcoal-kiln-001'].resource.charcoalKilnIdentification)
            .toContain('sideOpeningCharcoalKilnCandidate');
        expect(documentsById['feature-charcoal-kiln-001'].resource.charcoalKilnStructurePart)
            .toContain('sideOpeningClosureStone');
        expect(documentsById['feature-charcoal-kiln-001'].resource.charcoalKilnExcavationControl)
            .toContain('centralTrenchDeferred');
        expect(documentsById['feature-charcoal-kiln-001'].resource.charcoalKilnTraceInterpretation)
            .toContain('ceilingGrassTrace');
        expect(documentsById['sample-charcoal-kiln-carbon-001'].resource.charcoalKilnAnalysisPlan)
            .toContain('woodSpeciesAnalysis');
        expect(documentsById['sample-charcoal-kiln-archmag-001'].resource.archaeomagneticSampleContext)
            .toContain('sideOpeningCharcoalKiln');
        expect(documentsById['sample-charcoal-kiln-archmag-001'].resource.archaeomagneticSamplingWorkflow)
            .toContain('gypsumFixed');
        expect(documentsById['sample-charcoal-kiln-archmag-001'].resource.archaeomagneticOrientationRecord)
            .toContain('currentDeclinationRecorded');
        expect(documentsById['sample-charcoal-kiln-archmag-001'].resource.archaeomagneticResultQuality)
            .toContain('l95UnderThree');
        expect(documentsById['sample-charcoal-kiln-archmag-001'].resource.archaeomagneticChronologyInterpretation)
            .toContain('singleDateNotAccepted');
    });


    it('keeps the Korean conservation science sample aligned with field conservation fields', () => {

        const configReader = new ConfigReader();
        const config = configReader.read('/Config-KoreanFieldwork.json');
        const valuelists = configReader.read('/Library/Valuelists/Valuelists.json');
        const sample = loadSample('conservation-science-fieldwork-sample.json');
        const documents = sample.documents;
        const documentsById = documents.reduce((index: any, document: any) => {
            index[document.resource.id] = document;
            return index;
        }, {});

        expectSampleDocumentsToUseConfiguredFormsAndValuelists(sample, config, valuelists);

        expect(documentsById['find-waterlogged-lacquer-001'].resource.waterloggedWoodEmergencyStorage)
            .toContain('c14ImpactReview');
        expect(documentsById['find-waterlogged-lacquer-001'].resource.woodenArtifactConditionRecord)
            .toContain('woodSpeciesAnalysisPlanned');
        expect(documentsById['find-waterlogged-lacquer-001'].resource.lacquerConservationRisk)
            .toContain('lacquerFilmCrackingRisk');
        expect(documentsById['sample-waterlogged-wood-species-001'].resource.samplePurpose)
            .toContain('woodSpeciesIdentification');
        expect(documentsById['sample-waterlogged-wood-species-001'].resource.plantRemainIdentificationRecord)
            .toContain('regionalMasterChronologyChecked');
        expect(documentsById['find-metal-conservation-001'].resource.metalAnalysisRequest)
            .toContain('cuttingPolishingApproval');
        expect(documentsById['find-ceramic-salt-001'].resource.ceramicConservationState)
            .toContain('wetCleaningCaution');
        expect(documentsById['find-paper-textile-001'].resource.paperTextileEmergencyRecovery)
            .toContain('acclimationPeriod');
        expect(documentsById['find-waterlogged-lacquer-001'].resource.conservationTreatmentPrincipleReview)
            .toContain('evidenceDamageAvoided');
        expect(documentsById['sample-human-dna-soil-001'].resource.humanDnaFieldControl)
            .toContain('noFieldWashing');
        expect(documentsById['sample-human-dna-soil-001'].resource.organicSoilAnalysisSample)
            .toContain('exteriorControlSoil');
        expect(documentsById['sample-destructive-analysis-001'].resource.destructiveAnalysisDecision)
            .toContain('analysisApprovalNeeded');
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
        const termAliasForm = config.forms.TermAlias;
        const termImportMappingForm = config.forms.TermImportMapping;
        const sourceEvidenceIndexForm = config.forms.SourceEvidenceIndex;
        const excavationPermitDocumentSetForm = config.forms.ExcavationPermitDocumentSet;
        const reportSubmissionWorkflowForm = config.forms.ReportSubmissionWorkflow;
        const reportPreparationReviewForm = config.forms.ReportPreparationReview;
        const reportStandardHistoryForm = config.forms.ReportStandardHistory;
        const informationAssetForm = config.forms.InformationAsset;
        const stateVestingSelectionRecordForm = config.forms.StateVestingSelectionRecord;
        const ironProcessRelationForm = config.forms.IronProcessRelation;
        const findForm = config.forms['Find:default'];
        const sampleForm = config.forms['Sample:default'];
        const drawingForm = config.forms['Drawing:default'];
        const photoForm = config.forms['Photo:default'];

        expect(fieldRecordQualityReviewForm.parent).toBe('Operation');
        expect(fieldRecordQualityReviewForm.fields.reviewedRecordUnit.inputType).toBe('checkboxes');
        expect(fieldRecordQualityReviewForm.fields.qualityReviewStage.inputType).toBe('checkboxes');
        expect(fieldRecordQualityReviewForm.fields.qualityCorrectionBasis.inputType).toBe('checkboxes');
        expect(dailyLogForm.parent).toBe('Operation');
        expect(dailyLogForm.fields.operationRoleResponsibility.inputType).toBe('checkboxes');
        expect(dailyLogForm.fields.dailyLogEvidenceRole.inputType).toBe('checkboxes');
        expect(termAuthorityForm.parent).toBe('FeatureGroup');
        expect(termAuthorityForm.fields.termDictionaryDomain.inputType).toBe('checkboxes');
        expect(termAuthorityForm.fields.termApplicationScope.inputType).toBe('checkboxes');
        expect(termAuthorityForm.fields.termSourcePriority.inputType).toBe('checkboxes');
        expect(termAuthorityForm.fields.dictionaryEditorialRule.inputType).toBe('checkboxes');
        expect(termAliasForm.parent).toBe('TermAuthority');
        expect(termAliasForm.fields.termAliasText.inputType).toBe('input');
        expect(termAliasForm.fields.termAliasText.mandatory).toBe(true);
        expect(termAliasForm.fields.termAliasRole.inputType).toBe('checkboxes');
        expect(termAliasForm.fields.termAliasHandling.inputType).toBe('checkboxes');
        expect(termImportMappingForm.parent).toBe('TermAuthority');
        expect(termImportMappingForm.fields.termImportSourceText.inputType).toBe('input');
        expect(termImportMappingForm.fields.termImportAuthorityText.inputType).toBe('input');
        expect(termImportMappingForm.fields.termImportReportText.inputType).toBe('input');
        expect(termImportMappingForm.fields.termImportSourceText.mandatory).toBe(true);
        expect(termImportMappingForm.fields.termImportAuthorityText.mandatory).toBe(true);
        expect(sourceEvidenceIndexForm.parent).toBe('Project');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceCitation.inputType).toBe('input');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceLocator.inputType).toBe('input');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceCitation.mandatory).toBe(true);
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceLocator.mandatory).toBe(true);
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceMaterial.inputType).toBe('checkboxes');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceDomain.inputType).toBe('checkboxes');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceVerification.inputType).toBe('checkboxes');
        expect(sourceEvidenceIndexForm.fields.sourceEvidenceUse.inputType).toBe('checkboxes');
        expect(excavationPermitDocumentSetForm.parent).toBe('Project');
        expect(excavationPermitDocumentSetForm.fields.permitApplicationTitleText.inputType).toBe('input');
        expect(excavationPermitDocumentSetForm.fields.permitApplicationTitleText.mandatory).toBe(true);
        expect(excavationPermitDocumentSetForm.fields.permitApplicantText.inputType).toBe('input');
        expect(excavationPermitDocumentSetForm.fields.permitSubmissionAgencyText.inputType).toBe('input');
        expect(excavationPermitDocumentSetForm.fields.permitDocumentReferenceText.inputType).toBe('input');
        expect(excavationPermitDocumentSetForm.fields.excavationPermitDocumentSet.inputType).toBe('checkboxes');
        expect(reportSubmissionWorkflowForm.parent).toBe('Project');
        expect(reportSubmissionWorkflowForm.fields.reportSubmissionDocumentText.inputType).toBe('input');
        expect(reportSubmissionWorkflowForm.fields.reportSubmissionDocumentText.mandatory).toBe(true);
        expect(reportSubmissionWorkflowForm.fields.reportSubmissionRecipientText.inputType).toBe('input');
        expect(reportSubmissionWorkflowForm.fields.reportSubmissionReceiptText.inputType).toBe('input');
        expect(reportSubmissionWorkflowForm.fields.reportSubmissionWorkflow.inputType).toBe('checkboxes');
        expect(reportPreparationReviewForm.parent).toBe('Project');
        expect(reportPreparationReviewForm.fields.reportPreparationSubjectText.inputType).toBe('input');
        expect(reportPreparationReviewForm.fields.reportPreparationSubjectText.mandatory).toBe(true);
        expect(reportPreparationReviewForm.fields.reportPreparationSourceText.inputType).toBe('input');
        expect(reportPreparationReviewForm.fields.reportPreparationStandardText.inputType).toBe('input');
        expect(reportPreparationReviewForm.fields.reportPreparationReview.inputType).toBe('checkboxes');
        expect(reportStandardHistoryForm.parent).toBe('Project');
        expect(reportStandardHistoryForm.fields.reportStandardScopeText.inputType).toBe('input');
        expect(reportStandardHistoryForm.fields.reportStandardScopeText.mandatory).toBe(true);
        expect(reportStandardHistoryForm.fields.reportStandardVersionText.inputType).toBe('input');
        expect(reportStandardHistoryForm.fields.reportStandardChangeReasonText.inputType).toBe('input');
        expect(reportStandardHistoryForm.fields.reportStandardSourceLinkText.inputType).toBe('input');
        expect(reportStandardHistoryForm.fields.reportStandardHistory.inputType).toBe('checkboxes');
        expect(informationAssetForm.parent).toBe('Project');
        expect(informationAssetForm.fields.informationAssetTitleText.inputType).toBe('input');
        expect(informationAssetForm.fields.informationAssetTitleText.mandatory).toBe(true);
        expect(informationAssetForm.fields.informationAssetIdentifierText.inputType).toBe('input');
        expect(informationAssetForm.fields.informationAssetLocationText.inputType).toBe('input');
        expect(informationAssetForm.fields.informationAssetLinkText.inputType).toBe('input');
        expect(informationAssetForm.fields.informationAssetType.inputType).toBe('checkboxes');
        expect(informationAssetForm.fields.informationAssetManagement.inputType).toBe('checkboxes');
        expect(stateVestingSelectionRecordForm.parent).toBe('Project');
        expect(stateVestingSelectionRecordForm.fields.stateVestingObjectScopeText.inputType).toBe('input');
        expect(stateVestingSelectionRecordForm.fields.stateVestingObjectScopeText.mandatory).toBe(true);
        expect(stateVestingSelectionRecordForm.fields.stateVestingCustodyText.inputType).toBe('input');
        expect(stateVestingSelectionRecordForm.fields.stateVestingReceiptText.inputType).toBe('input');
        expect(stateVestingSelectionRecordForm.fields.stateVestingSelectionRecord.inputType).toBe('checkboxes');
        expect(ironProcessRelationForm.parent).toBe('Feature');
        expect(ironProcessRelationForm.fields.ironPreviousProcessText.inputType).toBe('input');
        expect(ironProcessRelationForm.fields.ironPreviousOutputText.inputType).toBe('input');
        expect(ironProcessRelationForm.fields.ironPreviousOutputText.mandatory).toBe(true);
        expect(ironProcessRelationForm.fields.ironNextProcessText.inputType).toBe('input');
        expect(ironProcessRelationForm.fields.ironNextInputText.inputType).toBe('input');
        expect(ironProcessRelationForm.fields.ironNextInputText.mandatory).toBe(true);
        expect(ironProcessRelationForm.fields.ironProcessRelationCheck.inputType).toBe('checkboxes');
        expect(ironProcessRelationForm.fields.verificationState.inputType).toBe('dropdown');
        expect(operationForm.fields.fieldRecordQuality.inputType).toBe('checkboxes');
        expect(operationForm.fields.operationRoleResponsibility.inputType).toBe('checkboxes');
        expect(operationForm.fields.siteProtectionSecurity.inputType).toBe('checkboxes');
        expect(operationForm.fields.excavationControlSafety.inputType).toBe('checkboxes');
        expect(operationForm.fields.gpsSurveyQualityRecord.inputType).toBe('checkboxes');
        expect(operationForm.fields.gpsNmeaRecord.inputType).toBe('checkboxes');
        expect(operationForm.fields.fieldDatabaseOperationRisk.inputType).toBe('checkboxes');
        expect(operationForm.fields.digitalSurveyQualityControl.inputType).toBe('checkboxes');
        expect(operationForm.fields.personalNotebookArchive.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogContent.inputType).toBe('checkboxes');
        expect(operationForm.fields.dailyLogReview.inputType).toBe('checkboxes');
        expect(operationForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(operationForm.fields.reportEvaluationFeedback.inputType).toBe('checkboxes');
        expect(projectForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(projectForm.fields.investigationRequestIntake.inputType).toBe('checkboxes');
        expect(projectForm.fields.investigationPlanChangeRecord.inputType).toBe('checkboxes');
        expect(projectForm.fields.expertReviewMeeting.inputType).toBe('checkboxes');
        expect(projectForm.fields.partialCompletionPackage.inputType).toBe('checkboxes');
        expect(projectForm.fields.recordTransferManagementSystem.inputType).toBe('checkboxes');
        expect(projectForm.fields.reportEvaluationFeedback.inputType).toBe('checkboxes');
        expect(projectForm.fields.publicArchaeologyOutput.inputType).toBe('checkboxes');
        expect(projectForm.fields.publicEngagementProgram.inputType).toBe('checkboxes');
        expect(projectForm.fields.accessControlTag.inputType).toBe('checkboxes');
        expect(projectForm.fields.overseasHeritageRisk.inputType).toBe('checkboxes');
        expect(projectForm.fields.koreanArchaeologyInstitutionalRisk.inputType).toBe('checkboxes');
        expect(projectForm.fields.researchRoleAssignment.inputType).toBe('checkboxes');
        expect(projectForm.fields.researchProcessBalance.inputType).toBe('checkboxes');
        expect(operationForm.fields.expertReviewMeeting.inputType).toBe('checkboxes');
        expect(operationForm.fields.partialCompletionPackage.inputType).toBe('checkboxes');
        expect(operationForm.fields.recordTransferManagementSystem.inputType).toBe('checkboxes');
        expect(operationForm.fields.publicEngagementProgram.inputType).toBe('checkboxes');
        expect(operationForm.fields.accessControlTag.inputType).toBe('checkboxes');
        expect(operationForm.fields.researchRoleAssignment.inputType).toBe('checkboxes');
        expect(operationForm.fields.researchProcessBalance.inputType).toBe('checkboxes');
        expect(operationForm.fields.experimentDesign.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyObservation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyBiasControl.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFollowUp.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyResultProcessing.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyPreparationCheck.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFieldSequence.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFieldDiary.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyMapRequirement.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyHeritageCategory.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyScopeDefinition.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyLowerChronologyReview.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyTeamExpertise.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyTimingReview.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceEvidenceAbsenceAssessment.inputType).toBe('checkboxes');
        expect(surveyForm.fields.nonSiteResourceSurvey.inputType).toBe('checkboxes');
        expect(surveyForm.fields.sampleSurveySuitability.inputType).toBe('checkboxes');
        expect(surveyForm.fields.trialExcavationPurpose.inputType).toBe('checkboxes');
        expect(surveyForm.fields.trialTrenchDesign.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicSurveyStage.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicLocationSource.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicFieldCollection.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicTrialPitCoordinateControl.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicProfileSampleRecord.inputType).toBe('checkboxes');
        expect(surveyForm.fields.paleolithicNonSiteResourceSurvey.inputType).toBe('checkboxes');
        expect(surveyForm.fields.excavationScopeDifficultyBasis.inputType).toBe('checkboxes');
        expect(surveyForm.fields.gisPredictionEvidence.inputType).toBe('checkboxes');
        expect(surveyForm.fields.gisPredictionFieldVerification.inputType).toBe('checkboxes');
        expect(surveyForm.fields.alluvialLandformSurvey.inputType).toBe('checkboxes');
        expect(surveyForm.fields.soilMapPredictionVerification.inputType).toBe('checkboxes');
        expect(surveyForm.fields.wetlandAnalysisSource.inputType).toBe('checkboxes');
        expect(surveyForm.fields.wetlandLandformInterpretation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.wetlandSurveyTargeting.inputType).toBe('checkboxes');
        expect(featureForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(featureForm.fields.interpretationArgument.inputType).toBe('checkboxes');
        expect(featureForm.fields.excavationContextModel.inputType).toBe('checkboxes');
        expect(featureForm.fields.excavationReverseSequenceCheck.inputType).toBe('checkboxes');
        expect(featureForm.fields.paleolithicLithicSpatialContext.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingExposureBaulk.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFloorFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFireEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingOverlapSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingInvestigationSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingSectionStrategy.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitFeatureFunctionAssessment.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitBuildingLifecycleStage.inputType).toBe('checkboxes');
        expect(featureForm.fields.surfaceBuildingJudgement.inputType).toBe('checkboxes');
        expect(featureForm.fields.postholeGroupSurvey.inputType).toBe('checkboxes');
        expect(featureForm.fields.foundationTraceRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.buildingExpertReview.inputType).toBe('checkboxes');
        expect(featureForm.fields.buildingReconstructionEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.buildingProspectionConservationRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.settlementFeatureInvestigationProcedure.inputType).toBe('checkboxes');
        expect(featureForm.fields.settlementFeatureTrenchStrategy.inputType).toBe('checkboxes');
        expect(featureForm.fields.productionProcessSystem.inputType).toBe('checkboxes');
        expect(featureForm.fields.productionSiteAssociatedFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.ironProcessEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.ironFurnaceStructure.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombMoundInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombBurialStructureInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombSurveyPurpose.inputType).toBe('checkboxes');
        expect(featureForm.fields.moundTrenchInvestigation.inputType).toBe('checkboxes');
        expect(featureForm.fields.moundFillSubdivisionRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombMoundOverlapSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.stoneCistWallPackingRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombInteriorRecoveryRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.stoneChamberTombTypology.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombPassageClosureSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.burialPlatformUseSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombRitualDepositRecord.inputType).toBe('checkboxes');
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
        expect(featureForm.fields.potteryKilnOperationScale.inputType).toBe('checkboxes');
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
        expect(featureSegmentForm.fields.stratigraphicDivisionBasis.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.soilParticleFieldCheck.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.layerBoundarySurfaceRecord.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.faciesSectionDrawingRecord.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.stratigraphicMisreadGuard.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.layerNamingSystem.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureFillInterpretation.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.naturalHumusRelativity.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.stratigraphicObservationProcedure.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureLifecycleReview.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureBlockInclusionAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureBurialProcessAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.stratigraphicRelationReview.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.paleolithicCulturalLayerReview.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.soilTextureFieldAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialLayerConceptAudit.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialSurfaceAttribution.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialFormationProcess.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.wetlandMicrotopographyRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactHandlingWorkflow.inputType).toBe('checkboxes');
        expect(findForm.fields.findSampleResearchScope.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactLabelRegisterLink.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactQuantityBasis.inputType).toBe('checkboxes');
        expect(findForm.fields.surfaceFindHandlingRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactRecoveryPreservationRisk.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactCleaningDryingControl.inputType).toBe('checkboxes');
        expect(findForm.fields.storageEnvironmentControl.inputType).toBe('checkboxes');
        expect(findForm.fields.conservationScienceRequest.inputType).toBe('checkboxes');
        expect(findForm.fields.waterloggedWoodEmergencyStorage.inputType).toBe('checkboxes');
        expect(findForm.fields.woodenArtifactConditionRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.lacquerConservationRisk.inputType).toBe('checkboxes');
        expect(findForm.fields.metalAnalysisRequest.inputType).toBe('checkboxes');
        expect(findForm.fields.ceramicConservationState.inputType).toBe('checkboxes');
        expect(findForm.fields.paperTextileEmergencyRecovery.inputType).toBe('checkboxes');
        expect(findForm.fields.conservationTreatmentPrincipleReview.inputType).toBe('checkboxes');
        expect(findForm.fields.ironResidueSubtype.inputType).toBe('checkboxes');
        expect(findForm.fields.graveGoodsRitualContext.inputType).toBe('checkboxes');
        expect(findForm.fields.neolithicSubsistenceEvidence.inputType).toBe('checkboxes');
        expect(findForm.fields.bronzeAgePotteryTerminology.inputType).toBe('checkboxes');
        expect(findForm.fields.ceramicTermScope.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryFabricTemperRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryTemperFunctionAssessment.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryProductionLifeRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryFormingTraceAssessment.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryFormingCaution.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryProcessDirectionality.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryProductionOrganizationEvidence.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryComparativeReferenceCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryExperimentalVariableRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryClassificationBasis.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryProvenanceDistributionReview.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryFiringTraceObservation.inputType).toBe('checkboxes');
        expect(findForm.fields.potteryKilnFurnitureContext.inputType).toBe('checkboxes');
        expect(findForm.fields.tileKilnFindContext.inputType).toBe('checkboxes');
        expect(findForm.fields.porcelainFindObservation.inputType).toBe('checkboxes');
        expect(findForm.fields.porcelainKilnFurnitureContext.inputType).toBe('checkboxes');
        expect(findForm.fields.typologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.chronologyArgument.inputType).toBe('checkboxes');
        expect(findForm.fields.assemblageRelation.inputType).toBe('checkboxes');
        expect(findForm.fields.interpretationArgument.inputType).toBe('checkboxes');
        expect(sampleForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(sampleForm.fields.findSampleResearchScope.inputType).toBe('checkboxes');
        expect(sampleForm.fields.pitDwellingScienceSamplingPlan.inputType).toBe('checkboxes');
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
        expect(sampleForm.fields.humanDnaFieldControl.inputType).toBe('checkboxes');
        expect(sampleForm.fields.organicSoilAnalysisSample.inputType).toBe('checkboxes');
        expect(sampleForm.fields.destructiveAnalysisDecision.inputType).toBe('checkboxes');
        expect(sampleForm.fields.shellMiddenSamplingStrategy.inputType).toBe('checkboxes');
        expect(sampleForm.fields.paleoenvironmentProxySampling.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeobotanySampleDesign.inputType).toBe('checkboxes');
        expect(sampleForm.fields.plantRemainSamplingMethod.inputType).toBe('checkboxes');
        expect(sampleForm.fields.flotationProcessingRecord.inputType).toBe('checkboxes');
        expect(sampleForm.fields.plantRemainIdentificationRecord.inputType).toBe('checkboxes');
        expect(sampleForm.fields.archaeobotanyInterpretationReview.inputType).toBe('checkboxes');
        expect(sampleForm.fields.plantRemainNonDetectionAssessment.inputType).toBe('checkboxes');
        expect(sampleForm.fields.faunalRecoverySampling.inputType).toBe('checkboxes');
        expect(sampleForm.fields.faunalPreservationHandling.inputType).toBe('checkboxes');
        expect(sampleForm.fields.zooarchaeologicalIdentification.inputType).toBe('checkboxes');
        expect(sampleForm.fields.boneSurfaceModification.inputType).toBe('checkboxes');
        expect(sampleForm.fields.zooarchaeologicalQuantification.inputType).toBe('checkboxes');
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
        expect(featureForm.fields.beaconPhysicalFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.beaconNetworkOperation.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortressBeaconRelation.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationConstructionEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationFoundationRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationRepairRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.fortificationRestorationEvidence.inputType).toBe('checkboxes');
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
        expect(drawingForm.fields.mapSourceMaterial.inputType).toBe('checkboxes');
        expect(drawingForm.fields.historicalMapLandscapeInterpretation.inputType).toBe('checkboxes');
        expect(drawingForm.fields.spatialDrawingProductionWorkflow.inputType).toBe('checkboxes');
        expect(drawingForm.fields.distributionMapRequirement.inputType).toBe('checkboxes');
        expect(drawingForm.fields.electronicDrawingSourceWorkflow.inputType).toBe('checkboxes');
        expect(drawingForm.fields.artifactElectronicDrawingProcedure.inputType).toBe('checkboxes');
        expect(drawingForm.fields.accessControlTag.inputType).toBe('checkboxes');
        expect(drawingForm.fields.mediaRights.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaEvidenceRole.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaQualityCheck.inputType).toBe('checkboxes');
        expect(photoForm.fields.photoCaptureSafetyReview.inputType).toBe('checkboxes');
        expect(photoForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(photoForm.fields.gpsPhotoLinkRecord.inputType).toBe('checkboxes');
        expect(photoForm.fields.reportCrossCheck.inputType).toBe('checkboxes');
        expect(photoForm.fields.accessControlTag.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaRights.inputType).toBe('checkboxes');

        expect(operationForm.valuelists.fieldRecordQuality).toBe('KoreanFieldwork-fieldRecordQuality');
        expect(operationForm.valuelists.operationRoleResponsibility)
            .toBe('KoreanFieldwork-operationRoleResponsibility');
        expect(operationForm.valuelists.siteProtectionSecurity)
            .toBe('KoreanFieldwork-siteProtectionSecurity');
        expect(operationForm.valuelists.excavationControlSafety)
            .toBe('KoreanFieldwork-excavationControlSafety');
        expect(operationForm.valuelists.gpsSurveyQualityRecord)
            .toBe('KoreanFieldwork-gpsSurveyQualityRecord');
        expect(operationForm.valuelists.gpsNmeaRecord)
            .toBe('KoreanFieldwork-gpsNmeaRecord');
        expect(operationForm.valuelists.fieldDatabaseOperationRisk)
            .toBe('KoreanFieldwork-fieldDatabaseOperationRisk');
        expect(operationForm.valuelists.digitalSurveyQualityControl)
            .toBe('KoreanFieldwork-digitalSurveyQualityControl');
        expect(operationForm.valuelists.personalNotebookArchive).toBe('KoreanFieldwork-personalNotebookArchive');
        expect(operationForm.valuelists.dailyLogContent).toBe('KoreanFieldwork-dailyLogContent');
        expect(operationForm.valuelists.dailyLogReview).toBe('KoreanFieldwork-dailyLogReview');
        expect(operationForm.valuelists.digitalSourcePreservation).toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(projectForm.valuelists.investigationRequestIntake)
            .toBe('KoreanFieldwork-investigationRequestIntake');
        expect(projectForm.valuelists.investigationPlanChangeRecord)
            .toBe('KoreanFieldwork-investigationPlanChangeRecord');
        expect(projectForm.valuelists.expertReviewMeeting).toBe('KoreanFieldwork-expertReviewMeeting');
        expect(projectForm.valuelists.partialCompletionPackage)
            .toBe('KoreanFieldwork-partialCompletionPackage');
        expect(projectForm.valuelists.recordTransferManagementSystem)
            .toBe('KoreanFieldwork-recordTransferManagementSystem');
        expect(excavationPermitDocumentSetForm.valuelists.excavationPermitDocumentSet)
            .toBe('KoreanFieldwork-excavationPermitDocumentSet');
        expect(excavationPermitDocumentSetForm.valuelists.verificationState)
            .toBe('KoreanFieldwork-verificationState');
        expect(reportSubmissionWorkflowForm.valuelists.reportSubmissionWorkflow)
            .toBe('KoreanFieldwork-reportSubmissionWorkflow');
        expect(reportSubmissionWorkflowForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(reportPreparationReviewForm.valuelists.reportPreparationReview)
            .toBe('KoreanFieldwork-reportPreparationReview');
        expect(reportPreparationReviewForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(reportStandardHistoryForm.valuelists.reportStandardHistory)
            .toBe('KoreanFieldwork-reportStandardHistory');
        expect(reportStandardHistoryForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(informationAssetForm.valuelists.informationAssetType)
            .toBe('KoreanFieldwork-informationAssetType');
        expect(informationAssetForm.valuelists.informationAssetManagement)
            .toBe('KoreanFieldwork-informationAssetManagement');
        expect(informationAssetForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(stateVestingSelectionRecordForm.valuelists.stateVestingSelectionRecord)
            .toBe('KoreanFieldwork-stateVestingSelectionRecord');
        expect(stateVestingSelectionRecordForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(operationForm.valuelists.expertReviewMeeting).toBe('KoreanFieldwork-expertReviewMeeting');
        expect(operationForm.valuelists.partialCompletionPackage)
            .toBe('KoreanFieldwork-partialCompletionPackage');
        expect(operationForm.valuelists.recordTransferManagementSystem)
            .toBe('KoreanFieldwork-recordTransferManagementSystem');
        expect(surveyForm.valuelists.surfaceSurveyResultProcessing)
            .toBe('KoreanFieldwork-surfaceSurveyResultProcessing');
        expect(operationForm.valuelists.reportEvaluationFeedback)
            .toBe('KoreanFieldwork-reportEvaluationFeedback');
        expect(projectForm.valuelists.reportEvaluationFeedback)
            .toBe('KoreanFieldwork-reportEvaluationFeedback');
        expect(projectForm.valuelists.publicArchaeologyOutput)
            .toBe('KoreanFieldwork-publicArchaeologyOutput');
        expect(projectForm.valuelists.publicEngagementProgram)
            .toBe('KoreanFieldwork-publicEngagementProgram');
        expect(projectForm.valuelists.accessControlTag)
            .toBe('KoreanFieldwork-accessControlTag');
        expect(projectForm.valuelists.overseasHeritageRisk)
            .toBe('KoreanFieldwork-overseasHeritageRisk');
        expect(projectForm.valuelists.koreanArchaeologyInstitutionalRisk)
            .toBe('KoreanFieldwork-koreanArchaeologyInstitutionalRisk');
        expect(projectForm.valuelists.researchRoleAssignment)
            .toBe('KoreanFieldwork-researchRoleAssignment');
        expect(projectForm.valuelists.researchProcessBalance)
            .toBe('KoreanFieldwork-researchProcessBalance');
        expect(operationForm.valuelists.publicEngagementProgram)
            .toBe('KoreanFieldwork-publicEngagementProgram');
        expect(operationForm.valuelists.accessControlTag)
            .toBe('KoreanFieldwork-accessControlTag');
        expect(operationForm.valuelists.researchRoleAssignment)
            .toBe('KoreanFieldwork-researchRoleAssignment');
        expect(operationForm.valuelists.researchProcessBalance)
            .toBe('KoreanFieldwork-researchProcessBalance');
        expect(operationForm.valuelists.experimentDesign)
            .toBe('KoreanFieldwork-experimentDesign');
        expect(fieldRecordQualityReviewForm.valuelists.reviewedRecordUnit)
            .toBe('KoreanFieldwork-reviewedRecordUnit');
        expect(fieldRecordQualityReviewForm.valuelists.qualityReviewStage)
            .toBe('KoreanFieldwork-qualityReviewStage');
        expect(fieldRecordQualityReviewForm.valuelists.qualityCorrectionBasis)
            .toBe('KoreanFieldwork-qualityCorrectionBasis');
        expect(fieldRecordQualityReviewForm.valuelists.fieldRecordQuality)
            .toBe('KoreanFieldwork-fieldRecordQuality');
        expect(dailyLogForm.valuelists.dailyLogContent).toBe('KoreanFieldwork-dailyLogContent');
        expect(dailyLogForm.valuelists.operationRoleResponsibility)
            .toBe('KoreanFieldwork-operationRoleResponsibility');
        expect(dailyLogForm.valuelists.dailyLogEvidenceRole)
            .toBe('KoreanFieldwork-dailyLogEvidenceRole');
        expect(dailyLogForm.valuelists.dailyLogReview).toBe('KoreanFieldwork-dailyLogReview');
        expect(termAuthorityForm.valuelists.termDictionaryDomain)
            .toBe('KoreanFieldwork-termDictionaryDomain');
        expect(termAuthorityForm.valuelists.termApplicationScope)
            .toBe('KoreanFieldwork-termApplicationScope');
        expect(termAuthorityForm.valuelists.termSourcePriority)
            .toBe('KoreanFieldwork-termSourcePriority');
        expect(termAuthorityForm.valuelists.dictionaryEditorialRule)
            .toBe('KoreanFieldwork-dictionaryEditorialRule');
        expect(termAuthorityForm.valuelists.termAuthorityStatus)
            .toBe('KoreanFieldwork-termAuthorityStatus');
        expect(termAliasForm.valuelists.termAliasRole).toBe('KoreanFieldwork-termAliasRole');
        expect(termAliasForm.valuelists.termAliasHandling).toBe('KoreanFieldwork-termAliasHandling');
        expect(termAliasForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(termAliasForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(termImportMappingForm.valuelists.termAliasHandling)
            .toBe('KoreanFieldwork-termAliasHandling');
        expect(termImportMappingForm.valuelists.termSearchMapping)
            .toBe('KoreanFieldwork-termSearchMapping');
        expect(termImportMappingForm.valuelists.termAuthorityStatus)
            .toBe('KoreanFieldwork-termAuthorityStatus');
        expect(sourceEvidenceIndexForm.valuelists.sourceEvidenceMaterial)
            .toBe('KoreanFieldwork-sourceEvidenceMaterial');
        expect(sourceEvidenceIndexForm.valuelists.sourceEvidenceDomain)
            .toBe('KoreanFieldwork-sourceEvidenceDomain');
        expect(sourceEvidenceIndexForm.valuelists.sourceEvidenceVerification)
            .toBe('KoreanFieldwork-sourceEvidenceVerification');
        expect(sourceEvidenceIndexForm.valuelists.sourceEvidenceUse)
            .toBe('KoreanFieldwork-sourceEvidenceUse');
        expect(surveyForm.valuelists.surfaceSurveyObservation).toBe('KoreanFieldwork-surfaceSurveyObservation');
        expect(surveyForm.valuelists.surfaceSurveyBiasControl).toBe('KoreanFieldwork-surfaceSurveyBiasControl');
        expect(surveyForm.valuelists.surfaceSurveyFollowUp).toBe('KoreanFieldwork-surfaceSurveyFollowUp');
        expect(surveyForm.valuelists.surfaceSurveyPreparationCheck)
            .toBe('KoreanFieldwork-surfaceSurveyPreparationCheck');
        expect(surveyForm.valuelists.surfaceSurveyFieldSequence)
            .toBe('KoreanFieldwork-surfaceSurveyFieldSequence');
        expect(surveyForm.valuelists.surfaceSurveyFieldDiary)
            .toBe('KoreanFieldwork-surfaceSurveyFieldDiary');
        expect(surveyForm.valuelists.surfaceSurveyMapRequirement)
            .toBe('KoreanFieldwork-surfaceSurveyMapRequirement');
        expect(surveyForm.valuelists.surfaceSurveyHeritageCategory)
            .toBe('KoreanFieldwork-surfaceSurveyHeritageCategory');
        expect(surveyForm.valuelists.surfaceSurveyScopeDefinition)
            .toBe('KoreanFieldwork-surfaceSurveyScopeDefinition');
        expect(surveyForm.valuelists.surfaceSurveyLowerChronologyReview)
            .toBe('KoreanFieldwork-surfaceSurveyLowerChronologyReview');
        expect(surveyForm.valuelists.surfaceSurveyTeamExpertise)
            .toBe('KoreanFieldwork-surfaceSurveyTeamExpertise');
        expect(surveyForm.valuelists.surfaceSurveyTimingReview)
            .toBe('KoreanFieldwork-surfaceSurveyTimingReview');
        expect(surveyForm.valuelists.surfaceEvidenceAbsenceAssessment)
            .toBe('KoreanFieldwork-surfaceEvidenceAbsenceAssessment');
        expect(surveyForm.valuelists.nonSiteResourceSurvey)
            .toBe('KoreanFieldwork-nonSiteResourceSurvey');
        expect(surveyForm.valuelists.sampleSurveySuitability).toBe('KoreanFieldwork-sampleSurveySuitability');
        expect(surveyForm.valuelists.trialExcavationPurpose).toBe('KoreanFieldwork-trialExcavationPurpose');
        expect(surveyForm.valuelists.trialTrenchDesign).toBe('KoreanFieldwork-trialTrenchDesign');
        expect(surveyForm.valuelists.paleolithicSurveyStage)
            .toBe('KoreanFieldwork-paleolithicSurveyStage');
        expect(surveyForm.valuelists.paleolithicLocationSource)
            .toBe('KoreanFieldwork-paleolithicLocationSource');
        expect(surveyForm.valuelists.paleolithicFieldCollection)
            .toBe('KoreanFieldwork-paleolithicFieldCollection');
        expect(surveyForm.valuelists.paleolithicTrialPitCoordinateControl)
            .toBe('KoreanFieldwork-paleolithicTrialPitCoordinateControl');
        expect(surveyForm.valuelists.paleolithicProfileSampleRecord)
            .toBe('KoreanFieldwork-paleolithicProfileSampleRecord');
        expect(surveyForm.valuelists.paleolithicNonSiteResourceSurvey)
            .toBe('KoreanFieldwork-paleolithicNonSiteResourceSurvey');
        expect(surveyForm.valuelists.excavationScopeDifficultyBasis)
            .toBe('KoreanFieldwork-excavationScopeDifficultyBasis');
        expect(surveyForm.valuelists.gisPredictionEvidence).toBe('KoreanFieldwork-gisPredictionEvidence');
        expect(surveyForm.valuelists.gisPredictionFieldVerification)
            .toBe('KoreanFieldwork-gisPredictionFieldVerification');
        expect(surveyForm.valuelists.alluvialLandformSurvey)
            .toBe('KoreanFieldwork-alluvialLandformSurvey');
        expect(surveyForm.valuelists.soilMapPredictionVerification)
            .toBe('KoreanFieldwork-soilMapPredictionVerification');
        expect(surveyForm.valuelists.wetlandAnalysisSource).toBe('KoreanFieldwork-wetlandAnalysisSource');
        expect(surveyForm.valuelists.wetlandLandformInterpretation)
            .toBe('KoreanFieldwork-wetlandLandformInterpretation');
        expect(surveyForm.valuelists.wetlandSurveyTargeting)
            .toBe('KoreanFieldwork-wetlandSurveyTargeting');
        expect(featureForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.typologyArgument).toBe('KoreanFieldwork-typologyArgument');
        expect(featureForm.valuelists.chronologyArgument).toBe('KoreanFieldwork-chronologyArgument');
        expect(featureForm.valuelists.assemblageRelation).toBe('KoreanFieldwork-assemblageRelation');
        expect(featureForm.valuelists.interpretationArgument).toBe('KoreanFieldwork-interpretationArgument');
        expect(featureForm.valuelists.excavationContextModel)
            .toBe('KoreanFieldwork-excavationContextModel');
        expect(featureForm.valuelists.excavationReverseSequenceCheck)
            .toBe('KoreanFieldwork-excavationReverseSequenceCheck');
        expect(featureForm.valuelists.paleolithicLithicSpatialContext)
            .toBe('KoreanFieldwork-paleolithicLithicSpatialContext');
        expect(featureForm.valuelists.pitDwellingExposureBaulk)
            .toBe('KoreanFieldwork-pitDwellingExposureBaulk');
        expect(featureForm.valuelists.pitDwellingFloorFacility)
            .toBe('KoreanFieldwork-pitDwellingFloorFacility');
        expect(featureForm.valuelists.pitDwellingFireEvidence)
            .toBe('KoreanFieldwork-pitDwellingFireEvidence');
        expect(featureForm.valuelists.pitDwellingOverlapSequence)
            .toBe('KoreanFieldwork-pitDwellingOverlapSequence');
        expect(featureForm.valuelists.pitDwellingInvestigationSequence)
            .toBe('KoreanFieldwork-pitDwellingInvestigationSequence');
        expect(featureForm.valuelists.pitDwellingSectionStrategy)
            .toBe('KoreanFieldwork-pitDwellingSectionStrategy');
        expect(featureForm.valuelists.pitFeatureFunctionAssessment)
            .toBe('KoreanFieldwork-pitFeatureFunctionAssessment');
        expect(featureForm.valuelists.pitBuildingLifecycleStage)
            .toBe('KoreanFieldwork-pitBuildingLifecycleStage');
        expect(featureForm.valuelists.surfaceBuildingJudgement)
            .toBe('KoreanFieldwork-surfaceBuildingJudgement');
        expect(featureForm.valuelists.postholeGroupSurvey)
            .toBe('KoreanFieldwork-postholeGroupSurvey');
        expect(featureForm.valuelists.foundationTraceRecord)
            .toBe('KoreanFieldwork-foundationTraceRecord');
        expect(featureForm.valuelists.buildingExpertReview)
            .toBe('KoreanFieldwork-buildingExpertReview');
        expect(featureForm.valuelists.buildingReconstructionEvidence)
            .toBe('KoreanFieldwork-buildingReconstructionEvidence');
        expect(featureForm.valuelists.buildingProspectionConservationRecord)
            .toBe('KoreanFieldwork-buildingProspectionConservationRecord');
        expect(featureForm.valuelists.settlementFeatureInvestigationProcedure)
            .toBe('KoreanFieldwork-settlementFeatureInvestigationProcedure');
        expect(featureForm.valuelists.settlementFeatureTrenchStrategy)
            .toBe('KoreanFieldwork-settlementFeatureTrenchStrategy');
        expect(featureForm.valuelists.productionProcessSystem)
            .toBe('KoreanFieldwork-productionProcessSystem');
        expect(featureForm.valuelists.productionSiteAssociatedFacility)
            .toBe('KoreanFieldwork-productionSiteAssociatedFacility');
        expect(featureForm.valuelists.ironProcessEvidence).toBe('KoreanFieldwork-ironProcessEvidence');
        expect(featureForm.valuelists.ironFurnaceStructure).toBe('KoreanFieldwork-ironFurnaceStructure');
        expect(ironProcessRelationForm.valuelists.ironProcessRelationCheck)
            .toBe('KoreanFieldwork-ironProcessRelationCheck');
        expect(ironProcessRelationForm.valuelists.verificationState).toBe('KoreanFieldwork-verificationState');
        expect(featureForm.valuelists.tombMoundInvestigation)
            .toBe('KoreanFieldwork-tombMoundInvestigation');
        expect(featureForm.valuelists.tombBurialStructureInvestigation)
            .toBe('KoreanFieldwork-tombBurialStructureInvestigation');
        expect(featureForm.valuelists.tombSurveyPurpose)
            .toBe('KoreanFieldwork-tombSurveyPurpose');
        expect(featureForm.valuelists.moundTrenchInvestigation)
            .toBe('KoreanFieldwork-moundTrenchInvestigation');
        expect(featureForm.valuelists.moundFillSubdivisionRecord)
            .toBe('KoreanFieldwork-moundFillSubdivisionRecord');
        expect(featureForm.valuelists.tombMoundOverlapSequence)
            .toBe('KoreanFieldwork-tombMoundOverlapSequence');
        expect(featureForm.valuelists.stoneCistWallPackingRecord)
            .toBe('KoreanFieldwork-stoneCistWallPackingRecord');
        expect(featureForm.valuelists.tombInteriorRecoveryRecord)
            .toBe('KoreanFieldwork-tombInteriorRecoveryRecord');
        expect(featureForm.valuelists.stoneChamberTombTypology)
            .toBe('KoreanFieldwork-stoneChamberTombTypology');
        expect(featureForm.valuelists.tombPassageClosureSequence)
            .toBe('KoreanFieldwork-tombPassageClosureSequence');
        expect(featureForm.valuelists.burialPlatformUseSequence)
            .toBe('KoreanFieldwork-burialPlatformUseSequence');
        expect(featureForm.valuelists.tombRitualDepositRecord)
            .toBe('KoreanFieldwork-tombRitualDepositRecord');
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
        expect(featureForm.valuelists.potteryKilnOperationScale)
            .toBe('KoreanFieldwork-potteryKilnOperationScale');
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
        expect(featureSegmentForm.valuelists.stratigraphicDivisionBasis)
            .toBe('KoreanFieldwork-stratigraphicDivisionBasis');
        expect(featureSegmentForm.valuelists.soilParticleFieldCheck)
            .toBe('KoreanFieldwork-soilParticleFieldCheck');
        expect(featureSegmentForm.valuelists.layerBoundarySurfaceRecord)
            .toBe('KoreanFieldwork-layerBoundarySurfaceRecord');
        expect(featureSegmentForm.valuelists.faciesSectionDrawingRecord)
            .toBe('KoreanFieldwork-faciesSectionDrawingRecord');
        expect(featureSegmentForm.valuelists.stratigraphicMisreadGuard)
            .toBe('KoreanFieldwork-stratigraphicMisreadGuard');
        expect(featureSegmentForm.valuelists.layerNamingSystem)
            .toBe('KoreanFieldwork-layerNamingSystem');
        expect(featureSegmentForm.valuelists.featureFillInterpretation)
            .toBe('KoreanFieldwork-featureFillInterpretation');
        expect(featureSegmentForm.valuelists.naturalHumusRelativity)
            .toBe('KoreanFieldwork-naturalHumusRelativity');
        expect(featureSegmentForm.valuelists.stratigraphicObservationProcedure)
            .toBe('KoreanFieldwork-stratigraphicObservationProcedure');
        expect(featureSegmentForm.valuelists.featureLifecycleReview)
            .toBe('KoreanFieldwork-featureLifecycleReview');
        expect(featureSegmentForm.valuelists.featureBlockInclusionAssessment)
            .toBe('KoreanFieldwork-featureBlockInclusionAssessment');
        expect(featureSegmentForm.valuelists.featureBurialProcessAssessment)
            .toBe('KoreanFieldwork-featureBurialProcessAssessment');
        expect(featureSegmentForm.valuelists.stratigraphicRelationReview)
            .toBe('KoreanFieldwork-stratigraphicRelationReview');
        expect(featureSegmentForm.valuelists.paleolithicCulturalLayerReview)
            .toBe('KoreanFieldwork-paleolithicCulturalLayerReview');
        expect(featureSegmentForm.valuelists.soilTextureFieldAssessment)
            .toBe('KoreanFieldwork-soilTextureFieldAssessment');
        expect(featureSegmentForm.valuelists.alluvialLayerConceptAudit)
            .toBe('KoreanFieldwork-alluvialLayerConceptAudit');
        expect(featureSegmentForm.valuelists.alluvialSurfaceAttribution)
            .toBe('KoreanFieldwork-alluvialSurfaceAttribution');
        expect(featureSegmentForm.valuelists.alluvialFormationProcess)
            .toBe('KoreanFieldwork-alluvialFormationProcess');
        expect(featureSegmentForm.valuelists.wetlandMicrotopographyRecord)
            .toBe('KoreanFieldwork-wetlandMicrotopographyRecord');
        expect(findForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(findForm.valuelists.artifactHandlingWorkflow).toBe('KoreanFieldwork-artifactHandlingWorkflow');
        expect(findForm.valuelists.findSampleResearchScope).toBe('KoreanFieldwork-findSampleResearchScope');
        expect(findForm.valuelists.artifactLabelRegisterLink)
            .toBe('KoreanFieldwork-artifactLabelRegisterLink');
        expect(findForm.valuelists.artifactQuantityBasis).toBe('KoreanFieldwork-artifactQuantityBasis');
        expect(findForm.valuelists.surfaceFindHandlingRecord)
            .toBe('KoreanFieldwork-surfaceFindHandlingRecord');
        expect(findForm.valuelists.artifactRecoveryPreservationRisk)
            .toBe('KoreanFieldwork-artifactRecoveryPreservationRisk');
        expect(findForm.valuelists.artifactCleaningDryingControl)
            .toBe('KoreanFieldwork-artifactCleaningDryingControl');
        expect(findForm.valuelists.storageEnvironmentControl).toBe('KoreanFieldwork-storageEnvironmentControl');
        expect(findForm.valuelists.conservationScienceRequest)
            .toBe('KoreanFieldwork-conservationScienceRequest');
        expect(findForm.valuelists.waterloggedWoodEmergencyStorage)
            .toBe('KoreanFieldwork-waterloggedWoodEmergencyStorage');
        expect(findForm.valuelists.woodenArtifactConditionRecord)
            .toBe('KoreanFieldwork-woodenArtifactConditionRecord');
        expect(findForm.valuelists.lacquerConservationRisk)
            .toBe('KoreanFieldwork-lacquerConservationRisk');
        expect(findForm.valuelists.metalAnalysisRequest).toBe('KoreanFieldwork-metalAnalysisRequest');
        expect(findForm.valuelists.ceramicConservationState)
            .toBe('KoreanFieldwork-ceramicConservationState');
        expect(findForm.valuelists.paperTextileEmergencyRecovery)
            .toBe('KoreanFieldwork-paperTextileEmergencyRecovery');
        expect(findForm.valuelists.conservationTreatmentPrincipleReview)
            .toBe('KoreanFieldwork-conservationTreatmentPrincipleReview');
        expect(findForm.valuelists.ironResidueSubtype).toBe('KoreanFieldwork-ironResidueSubtype');
        expect(findForm.valuelists.graveGoodsRitualContext).toBe('KoreanFieldwork-graveGoodsRitualContext');
        expect(findForm.valuelists.neolithicSubsistenceEvidence)
            .toBe('KoreanFieldwork-neolithicSubsistenceEvidence');
        expect(findForm.valuelists.bronzeAgePotteryTerminology)
            .toBe('KoreanFieldwork-bronzeAgePotteryTerminology');
        expect(findForm.valuelists.ceramicTermScope).toBe('KoreanFieldwork-ceramicTermScope');
        expect(findForm.valuelists.potteryFabricTemperRecord)
            .toBe('KoreanFieldwork-potteryFabricTemperRecord');
        expect(findForm.valuelists.potteryTemperFunctionAssessment)
            .toBe('KoreanFieldwork-potteryTemperFunctionAssessment');
        expect(findForm.valuelists.potteryProductionLifeRecord)
            .toBe('KoreanFieldwork-potteryProductionLifeRecord');
        expect(findForm.valuelists.potteryFormingTraceAssessment)
            .toBe('KoreanFieldwork-potteryFormingTraceAssessment');
        expect(findForm.valuelists.potteryFormingCaution)
            .toBe('KoreanFieldwork-potteryFormingCaution');
        expect(findForm.valuelists.potteryProcessDirectionality)
            .toBe('KoreanFieldwork-potteryProcessDirectionality');
        expect(findForm.valuelists.potteryProductionOrganizationEvidence)
            .toBe('KoreanFieldwork-potteryProductionOrganizationEvidence');
        expect(findForm.valuelists.potteryComparativeReferenceCheck)
            .toBe('KoreanFieldwork-potteryComparativeReferenceCheck');
        expect(findForm.valuelists.potteryExperimentalVariableRecord)
            .toBe('KoreanFieldwork-potteryExperimentalVariableRecord');
        expect(findForm.valuelists.potteryClassificationBasis)
            .toBe('KoreanFieldwork-potteryClassificationBasis');
        expect(findForm.valuelists.potteryProvenanceDistributionReview)
            .toBe('KoreanFieldwork-potteryProvenanceDistributionReview');
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
        expect(findForm.valuelists.interpretationArgument).toBe('KoreanFieldwork-interpretationArgument');
        expect(sampleForm.valuelists.fieldOnlyMissingCheck).toBe('KoreanFieldwork-fieldOnlyMissingCheck');
        expect(featureForm.valuelists.firstExposureRecord).toBe('KoreanFieldwork-firstExposureRecord');
        expect(featureForm.valuelists.fortificationHiddenGateFunction)
            .toBe('KoreanFieldwork-fortificationHiddenGateFunction');
        expect(featureForm.valuelists.fortificationParapetDetail)
            .toBe('KoreanFieldwork-fortificationParapetDetail');
        expect(featureForm.valuelists.beaconPhysicalFacility)
            .toBe('KoreanFieldwork-beaconPhysicalFacility');
        expect(featureForm.valuelists.beaconNetworkOperation)
            .toBe('KoreanFieldwork-beaconNetworkOperation');
        expect(featureForm.valuelists.fortressBeaconRelation)
            .toBe('KoreanFieldwork-fortressBeaconRelation');
        expect(featureForm.valuelists.fortificationConstructionEvidence)
            .toBe('KoreanFieldwork-fortificationConstructionEvidence');
        expect(featureForm.valuelists.fortificationFoundationRecord)
            .toBe('KoreanFieldwork-fortificationFoundationRecord');
        expect(featureForm.valuelists.fortificationRepairRecord)
            .toBe('KoreanFieldwork-fortificationRepairRecord');
        expect(featureForm.valuelists.fortificationRestorationEvidence)
            .toBe('KoreanFieldwork-fortificationRestorationEvidence');
        expect(featureForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(featureForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(findForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(findForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(sampleForm.valuelists.sampleCollectionHandling)
            .toBe('KoreanFieldwork-sampleCollectionHandling');
        expect(sampleForm.valuelists.findSampleResearchScope).toBe('KoreanFieldwork-findSampleResearchScope');
        expect(sampleForm.valuelists.pitDwellingScienceSamplingPlan)
            .toBe('KoreanFieldwork-pitDwellingScienceSamplingPlan');
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
        expect(sampleForm.valuelists.humanDnaFieldControl).toBe('KoreanFieldwork-humanDnaFieldControl');
        expect(sampleForm.valuelists.organicSoilAnalysisSample)
            .toBe('KoreanFieldwork-organicSoilAnalysisSample');
        expect(sampleForm.valuelists.destructiveAnalysisDecision)
            .toBe('KoreanFieldwork-destructiveAnalysisDecision');
        expect(sampleForm.valuelists.shellMiddenSamplingStrategy)
            .toBe('KoreanFieldwork-shellMiddenSamplingStrategy');
        expect(sampleForm.valuelists.paleoenvironmentProxySampling)
            .toBe('KoreanFieldwork-paleoenvironmentProxySampling');
        expect(sampleForm.valuelists.archaeobotanySampleDesign)
            .toBe('KoreanFieldwork-archaeobotanySampleDesign');
        expect(sampleForm.valuelists.plantRemainSamplingMethod)
            .toBe('KoreanFieldwork-plantRemainSamplingMethod');
        expect(sampleForm.valuelists.flotationProcessingRecord)
            .toBe('KoreanFieldwork-flotationProcessingRecord');
        expect(sampleForm.valuelists.plantRemainIdentificationRecord)
            .toBe('KoreanFieldwork-plantRemainIdentificationRecord');
        expect(sampleForm.valuelists.archaeobotanyInterpretationReview)
            .toBe('KoreanFieldwork-archaeobotanyInterpretationReview');
        expect(sampleForm.valuelists.plantRemainNonDetectionAssessment)
            .toBe('KoreanFieldwork-plantRemainNonDetectionAssessment');
        expect(sampleForm.valuelists.faunalRecoverySampling)
            .toBe('KoreanFieldwork-faunalRecoverySampling');
        expect(sampleForm.valuelists.faunalPreservationHandling)
            .toBe('KoreanFieldwork-faunalPreservationHandling');
        expect(sampleForm.valuelists.zooarchaeologicalIdentification)
            .toBe('KoreanFieldwork-zooarchaeologicalIdentification');
        expect(sampleForm.valuelists.boneSurfaceModification)
            .toBe('KoreanFieldwork-boneSurfaceModification');
        expect(sampleForm.valuelists.zooarchaeologicalQuantification)
            .toBe('KoreanFieldwork-zooarchaeologicalQuantification');
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
        expect(drawingForm.valuelists.mapSourceMaterial)
            .toBe('KoreanFieldwork-mapSourceMaterial');
        expect(drawingForm.valuelists.historicalMapLandscapeInterpretation)
            .toBe('KoreanFieldwork-historicalMapLandscapeInterpretation');
        expect(drawingForm.valuelists.spatialDrawingProductionWorkflow)
            .toBe('KoreanFieldwork-spatialDrawingProductionWorkflow');
        expect(drawingForm.valuelists.distributionMapRequirement)
            .toBe('KoreanFieldwork-distributionMapRequirement');
        expect(drawingForm.valuelists.electronicDrawingSourceWorkflow)
            .toBe('KoreanFieldwork-electronicDrawingSourceWorkflow');
        expect(drawingForm.valuelists.artifactElectronicDrawingProcedure)
            .toBe('KoreanFieldwork-artifactElectronicDrawingProcedure');
        expect(drawingForm.valuelists.accessControlTag)
            .toBe('KoreanFieldwork-accessControlTag');
        expect(drawingForm.valuelists.mediaRights).toBe('KoreanFieldwork-mediaRights');
        expect(photoForm.valuelists.mediaEvidenceRole).toBe('KoreanFieldwork-mediaEvidenceRole');
        expect(photoForm.valuelists.mediaQualityCheck).toBe('KoreanFieldwork-mediaQualityCheck');
        expect(photoForm.valuelists.photoCaptureSafetyReview)
            .toBe('KoreanFieldwork-photoCaptureSafetyReview');
        expect(photoForm.valuelists.digitalSourcePreservation)
            .toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(photoForm.valuelists.gpsPhotoLinkRecord)
            .toBe('KoreanFieldwork-gpsPhotoLinkRecord');
        expect(photoForm.valuelists.reportCrossCheck).toBe('KoreanFieldwork-reportCrossCheck');
        expect(photoForm.valuelists.accessControlTag)
            .toBe('KoreanFieldwork-accessControlTag');
        expect(photoForm.valuelists.mediaRights).toBe('KoreanFieldwork-mediaRights');
    });


    it('provides project language and valuelist labels for the field-record preservation fields', () => {

        const configReader = new ConfigReader();
        const languages = configReader.getCustomLanguageConfigurations('KoreanFieldwork');
        const valuelistLanguages = configReader.getValuelistsLanguages();

        expect(languages.en.categories.FieldRecordQualityReview.label).toBe('Field record quality review');
        expect(languages.en.categories.FieldRecordQualityReview.fields.reviewedRecordUnit.label)
            .toBe('Reviewed record unit');
        expect(languages.en.categories.DailyLog.label).toBe('Daily log');
        expect(languages.en.categories.DailyLog.fields.operationRoleResponsibility.label)
            .toBe('Operation role responsibility');
        expect(languages.en.categories.DailyLog.fields.dailyLogEvidenceRole.label)
            .toBe('Daily log evidence role');
        expect(languages.en.categories.TermAuthority.label).toBe('Term authority');
        expect(languages.en.categories.TermAuthority.fields.termDictionaryDomain.label)
            .toBe('Dictionary domain');
        expect(languages.en.categories.TermAuthority.fields.dictionaryEditorialRule.label)
            .toBe('Dictionary editorial rule');
        expect(languages.en.categories.TermAlias.label).toBe('Term alias');
        expect(languages.en.categories.TermAlias.fields.termAliasText.label).toBe('Alias text');
        expect(languages.en.categories.TermAlias.fields.termAliasRole.label).toBe('Alias role');
        expect(languages.en.categories.TermAlias.fields.termAliasHandling.label).toBe('Alias handling');
        expect(languages.en.categories.TermImportMapping.label).toBe('Term import mapping');
        expect(languages.en.categories.TermImportMapping.fields.termImportSourceText.label)
            .toBe('Imported source term');
        expect(languages.en.categories.TermImportMapping.fields.termImportAuthorityText.label)
            .toBe('Authority headword');
        expect(languages.en.categories.SourceEvidenceIndex.label).toBe('Source evidence index');
        expect(languages.en.categories.SourceEvidenceIndex.fields.sourceEvidenceCitation.label)
            .toBe('Source citation');
        expect(languages.en.categories.SourceEvidenceIndex.fields.sourceEvidenceLocator.label)
            .toBe('Page and figure locator');
        expect(languages.en.categories.SourceEvidenceIndex.fields.sourceEvidenceMaterial.label)
            .toBe('Source material type');
        expect(languages.en.categories.SourceEvidenceIndex.fields.sourceEvidenceVerification.label)
            .toBe('Source verification status');
        expect(languages.en.categories.ExcavationPermitDocumentSet.label)
            .toBe('Excavation permit document set');
        expect(languages.en.categories.ExcavationPermitDocumentSet.fields.permitApplicationTitleText.label)
            .toBe('Application title');
        expect(languages.en.categories.ExcavationPermitDocumentSet.fields.excavationPermitDocumentSet.label)
            .toBe('Excavation permit document set');
        expect(languages.en.categories.ReportSubmissionWorkflow.label).toBe('Report submission workflow');
        expect(languages.en.categories.ReportSubmissionWorkflow.fields.reportSubmissionDocumentText.label)
            .toBe('Submission document');
        expect(languages.en.categories.ReportSubmissionWorkflow.fields.reportSubmissionReceiptText.label)
            .toBe('Submission receipt');
        expect(languages.en.categories.ReportPreparationReview.label).toBe('Report preparation review');
        expect(languages.en.categories.ReportPreparationReview.fields.reportPreparationSubjectText.label)
            .toBe('Preparation subject');
        expect(languages.en.categories.ReportPreparationReview.fields.reportPreparationReview.label)
            .toBe('Report preparation review');
        expect(languages.en.categories.ReportStandardHistory.label).toBe('Report standard history');
        expect(languages.en.categories.ReportStandardHistory.fields.reportStandardScopeText.label)
            .toBe('Standard scope');
        expect(languages.en.categories.ReportStandardHistory.fields.reportStandardHistory.label)
            .toBe('Report standard history');
        expect(languages.en.categories.InformationAsset.label).toBe('Information asset');
        expect(languages.en.categories.InformationAsset.fields.informationAssetTitleText.label)
            .toBe('Asset title');
        expect(languages.en.categories.InformationAsset.fields.informationAssetManagement.label)
            .toBe('Asset management');
        expect(languages.en.categories.StateVestingSelectionRecord.label).toBe('State vesting selection record');
        expect(languages.en.categories.StateVestingSelectionRecord.fields.stateVestingObjectScopeText.label)
            .toBe('Object scope');
        expect(languages.en.categories.StateVestingSelectionRecord.fields.stateVestingReceiptText.label)
            .toBe('Receipt or register');
        expect(languages.en.categories.IronProcessRelation.label).toBe('Iron process relation');
        expect(languages.en.categories.IronProcessRelation.fields.ironPreviousOutputText.label)
            .toBe('Previous output');
        expect(languages.en.categories.IronProcessRelation.fields.ironNextInputText.label)
            .toBe('Next input');
        expect(languages.en.categories.IronProcessRelation.fields.ironProcessRelationCheck.label)
            .toBe('Process relation check');
        expect(languages.en.categories.Operation.fields.fieldRecordQuality.label).toBe('Field record quality');
        expect(languages.en.categories.Operation.fields.operationRoleResponsibility.label)
            .toBe('Operation role responsibility');
        expect(languages.en.categories.Operation.fields.siteProtectionSecurity.label)
            .toBe('Site protection and security');
        expect(languages.en.categories.Operation.fields.excavationControlSafety.label)
            .toBe('Excavation control and safety');
        expect(languages.en.categories.Operation.fields.personalNotebookArchive.label).toBe('Personal notebook archive');
        expect(languages.en.categories.Operation.fields.dailyLogContent.label).toBe('Daily work log');
        expect(languages.en.categories.Operation.fields.dailyLogReview.label).toBe('Daily log review');
        expect(languages.en.categories.Operation.fields.gpsSurveyQualityRecord.label)
            .toBe('GPS survey quality record');
        expect(languages.en.categories.Operation.fields.gpsNmeaRecord.label)
            .toBe('GPS NMEA record');
        expect(languages.en.categories.Operation.fields.fieldDatabaseOperationRisk.label)
            .toBe('Field database operation risk');
        expect(languages.en.categories.Operation.fields.digitalSurveyQualityControl.label)
            .toBe('Digital survey quality control');
        expect(languages.en.categories.Project.fields.digitalSourcePreservation.label).toBe('Digital source preservation');
        expect(languages.en.categories.Project.fields.reportEvaluationFeedback.label)
            .toBe('Report evaluation feedback');
        expect(languages.en.categories.Project.fields.publicArchaeologyOutput.label)
            .toBe('Public archaeology output');
        expect(languages.en.categories.Project.fields.overseasHeritageRisk.label)
            .toBe('Overseas heritage risk');
        expect(languages.en.categories.Project.fields.koreanArchaeologyInstitutionalRisk.label)
            .toBe('Korean archaeology institutional risk');
        expect(languages.en.categories.Project.fields.researchProcessBalance.label)
            .toBe('Research process balance');
        expect(languages.en.categories.Operation.fields.publicEngagementProgram.label)
            .toBe('Public engagement program');
        expect(languages.en.categories.Operation.fields.experimentDesign.label)
            .toBe('Experimental archaeology design');
        expect(languages.en.categories.Survey.fields.surfaceSurveyObservation.label)
            .toBe('Surface survey observation');
        expect(languages.en.categories.Survey.fields.surfaceSurveyPreparationCheck.label)
            .toBe('Surface survey preparation check');
        expect(languages.en.categories.Survey.fields.surfaceSurveyFieldSequence.label)
            .toBe('Surface survey field sequence');
        expect(languages.en.categories.Survey.fields.surfaceSurveyFieldDiary.label)
            .toBe('Surface survey field diary');
        expect(languages.en.categories.Survey.fields.surfaceSurveyMapRequirement.label)
            .toBe('Surface survey map requirement');
        expect(languages.en.categories.Survey.fields.surfaceSurveyHeritageCategory.label)
            .toBe('Surface survey heritage category');
        expect(languages.en.categories.Survey.fields.surfaceSurveyScopeDefinition.label)
            .toBe('Surface survey scope definition');
        expect(languages.en.categories.Survey.fields.surfaceSurveyLowerChronologyReview.label)
            .toBe('Surface survey lower chronology review');
        expect(languages.en.categories.Survey.fields.surfaceSurveyTeamExpertise.label)
            .toBe('Surface survey team expertise');
        expect(languages.en.categories.Survey.fields.surfaceSurveyTimingReview.label)
            .toBe('Surface survey timing review');
        expect(languages.en.categories.Survey.fields.surfaceEvidenceAbsenceAssessment.label)
            .toBe('Surface evidence absence assessment');
        expect(languages.en.categories.Survey.fields.nonSiteResourceSurvey.label)
            .toBe('Non-site resource survey');
        expect(languages.en.categories.Survey.fields.sampleSurveySuitability.label)
            .toBe('Sample survey suitability');
        expect(languages.en.categories.Survey.fields.trialExcavationPurpose.label)
            .toBe('Trial excavation purpose');
        expect(languages.en.categories.Survey.fields.trialTrenchDesign.label)
            .toBe('Trial trench design');
        expect(languages.en.categories.Survey.fields.paleolithicSurveyStage.label)
            .toBe('Paleolithic survey stage');
        expect(languages.en.categories.Survey.fields.paleolithicLocationSource.label)
            .toBe('Paleolithic location source');
        expect(languages.en.categories.Survey.fields.paleolithicFieldCollection.label)
            .toBe('Paleolithic field collection');
        expect(languages.en.categories.Survey.fields.paleolithicTrialPitCoordinateControl.label)
            .toBe('Paleolithic trial-pit coordinate control');
        expect(languages.en.categories.Survey.fields.paleolithicProfileSampleRecord.label)
            .toBe('Paleolithic profile sample record');
        expect(languages.en.categories.Survey.fields.paleolithicNonSiteResourceSurvey.label)
            .toBe('Paleolithic non-site resource survey');
        expect(languages.en.categories.Survey.fields.excavationScopeDifficultyBasis.label)
            .toBe('Excavation scope and difficulty basis');
        expect(languages.en.categories.Survey.fields.gisPredictionFieldVerification.label)
            .toBe('Prediction field verification');
        expect(languages.en.categories.Survey.fields.alluvialLandformSurvey.label)
            .toBe('Alluvial landform survey');
        expect(languages.en.categories.Survey.fields.soilMapPredictionVerification.label)
            .toBe('Soil map prediction verification');
        expect(languages.en.categories.Survey.fields.wetlandAnalysisSource.label)
            .toBe('Wetland analysis source');
        expect(languages.en.categories.Survey.fields.wetlandLandformInterpretation.label)
            .toBe('Wetland landform interpretation');
        expect(languages.en.categories.Survey.fields.wetlandSurveyTargeting.label)
            .toBe('Wetland interpretation and trench targeting');
        expect(languages.en.categories.Feature.fields.fieldOnlyMissingCheck.label)
            .toBe('Field-only missing check');
        expect(languages.en.categories.Feature.fields.typologyArgument.label).toBe('Typology argument');
        expect(languages.en.categories.Feature.fields.chronologyArgument.label).toBe('Chronology argument');
        expect(languages.en.categories.Feature.fields.assemblageRelation.label).toBe('Assemblage relation');
        expect(languages.en.categories.Feature.fields.interpretationArgument.label).toBe('Interpretation argument');
        expect(languages.en.categories.Feature.fields.excavationContextModel.label)
            .toBe('Excavation context model');
        expect(languages.en.categories.Feature.fields.excavationReverseSequenceCheck.label)
            .toBe('Excavation reverse sequence check');
        expect(languages.en.categories.Feature.fields.firstExposureRecord.label).toBe('First exposure record');
        expect(languages.en.categories.Feature.fields.pitDwellingExposureBaulk.label)
            .toBe('Pit dwelling exposure and baulk');
        expect(languages.en.categories.Feature.fields.pitDwellingFireEvidence.label)
            .toBe('Burned pit dwelling evidence');
        expect(languages.en.categories.Feature.fields.pitDwellingInvestigationSequence.label)
            .toBe('Pit dwelling investigation sequence');
        expect(languages.en.categories.Feature.fields.pitDwellingSectionStrategy.label)
            .toBe('Pit dwelling section strategy');
        expect(languages.en.categories.Feature.fields.pitFeatureFunctionAssessment.label)
            .toBe('Pit feature function assessment');
        expect(languages.en.categories.Feature.fields.pitBuildingLifecycleStage.label)
            .toBe('Pit building lifecycle stage');
        expect(languages.en.categories.Feature.fields.surfaceBuildingJudgement.label)
            .toBe('Surface building judgement');
        expect(languages.en.categories.Feature.fields.postholeGroupSurvey.label)
            .toBe('Posthole group survey');
        expect(languages.en.categories.Feature.fields.foundationTraceRecord.label)
            .toBe('Foundation trace record');
        expect(languages.en.categories.Feature.fields.buildingExpertReview.label)
            .toBe('Building expert review');
        expect(languages.en.categories.Feature.fields.buildingReconstructionEvidence.label)
            .toBe('Building reconstruction evidence');
        expect(languages.en.categories.Feature.fields.buildingProspectionConservationRecord.label)
            .toBe('Building prospection and conservation record');
        expect(languages.en.categories.Feature.fields.settlementFeatureInvestigationProcedure.label)
            .toBe('Settlement feature investigation procedure');
        expect(languages.en.categories.Feature.fields.settlementFeatureTrenchStrategy.label)
            .toBe('Settlement feature trench strategy');
        expect(languages.en.categories.Feature.fields.productionProcessSystem.label)
            .toBe('Production process system');
        expect(languages.en.categories.Feature.fields.productionSiteAssociatedFacility.label)
            .toBe('Production site associated facility');
        expect(languages.en.categories.Feature.fields.ironProcessEvidence.label).toBe('Iron process evidence');
        expect(languages.en.categories.Feature.fields.ironFurnaceStructure.label).toBe('Iron furnace structure');
        expect(languages.en.categories.Feature.fields.tombMoundInvestigation.label)
            .toBe('Tomb mound investigation');
        expect(languages.en.categories.Feature.fields.tombBurialStructureInvestigation.label)
            .toBe('Tomb burial structure investigation');
        expect(languages.en.categories.Feature.fields.tombSurveyPurpose.label)
            .toBe('Tomb survey purpose');
        expect(languages.en.categories.Feature.fields.moundTrenchInvestigation.label)
            .toBe('Mound trench investigation');
        expect(languages.en.categories.Feature.fields.moundFillSubdivisionRecord.label)
            .toBe('Mound fill subdivision record');
        expect(languages.en.categories.Feature.fields.tombMoundOverlapSequence.label)
            .toBe('Tomb mound overlap sequence');
        expect(languages.en.categories.Feature.fields.stoneCistWallPackingRecord.label)
            .toBe('Stone cist wall and packing record');
        expect(languages.en.categories.Feature.fields.tombInteriorRecoveryRecord.label)
            .toBe('Tomb interior recovery record');
        expect(languages.en.categories.Feature.fields.stoneChamberTombTypology.label)
            .toBe('Stone chamber tomb typology');
        expect(languages.en.categories.Feature.fields.tombPassageClosureSequence.label)
            .toBe('Tomb passage closure sequence');
        expect(languages.en.categories.Feature.fields.burialPlatformUseSequence.label)
            .toBe('Burial platform use sequence');
        expect(languages.en.categories.Feature.fields.tombRitualDepositRecord.label)
            .toBe('Tomb ritual deposit record');
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
        expect(languages.en.categories.Feature.fields.potteryKilnOperationScale.label)
            .toBe('Pottery kiln operation scale');
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
        expect(languages.en.categories.Feature.fields.beaconPhysicalFacility.label)
            .toBe('Beacon physical facility');
        expect(languages.en.categories.Feature.fields.beaconNetworkOperation.label)
            .toBe('Beacon route and operation');
        expect(languages.en.categories.Feature.fields.fortressBeaconRelation.label)
            .toBe('Fortress-beacon relation');
        expect(languages.en.categories.Feature.fields.fortificationConstructionEvidence.label)
            .toBe('Fortification construction evidence');
        expect(languages.en.categories.Feature.fields.fortificationFoundationRecord.label)
            .toBe('Fortification foundation record');
        expect(languages.en.categories.Feature.fields.fortificationRepairRecord.label)
            .toBe('Fortification repair record');
        expect(languages.en.categories.Feature.fields.fortificationRestorationEvidence.label)
            .toBe('Fortification restoration evidence');
        expect(languages.en.categories.Feature.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Feature.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicDivisionBasis.label)
            .toBe('Stratigraphic division basis');
        expect(languages.en.categories.FeatureSegment.fields.soilParticleFieldCheck.label)
            .toBe('Soil particle field check');
        expect(languages.en.categories.FeatureSegment.fields.layerBoundarySurfaceRecord.label)
            .toBe('Layer boundary surface record');
        expect(languages.en.categories.FeatureSegment.fields.faciesSectionDrawingRecord.label)
            .toBe('Facies section drawing record');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicMisreadGuard.label)
            .toBe('Stratigraphic misread guard');
        expect(languages.en.categories.FeatureSegment.fields.layerNamingSystem.label)
            .toBe('Layer naming system');
        expect(languages.en.categories.FeatureSegment.fields.featureFillInterpretation.label)
            .toBe('Feature fill interpretation');
        expect(languages.en.categories.FeatureSegment.fields.naturalHumusRelativity.label)
            .toBe('Natural/humus relativity');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicObservationProcedure.label)
            .toBe('Stratigraphic observation procedure');
        expect(languages.en.categories.FeatureSegment.fields.featureLifecycleReview.label)
            .toBe('Feature lifecycle review');
        expect(languages.en.categories.FeatureSegment.fields.featureBlockInclusionAssessment.label)
            .toBe('Feature block inclusion assessment');
        expect(languages.en.categories.FeatureSegment.fields.featureBurialProcessAssessment.label)
            .toBe('Feature burial process assessment');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicRelationReview.label)
            .toBe('Stratigraphic relation review');
        expect(languages.en.categories.Feature.fields.paleolithicLithicSpatialContext.label)
            .toBe('Paleolithic lithic spatial context');
        expect(languages.en.categories.FeatureSegment.fields.paleolithicCulturalLayerReview.label)
            .toBe('Paleolithic cultural layer review');
        expect(languages.en.categories.FeatureSegment.fields.soilTextureFieldAssessment.label)
            .toBe('Soil texture field assessment');
        expect(languages.en.categories.FeatureSegment.fields.alluvialLayerConceptAudit.label)
            .toBe('Alluvial layer concept audit');
        expect(languages.en.categories.FeatureSegment.fields.alluvialSurfaceAttribution.label)
            .toBe('Alluvial surface attribution');
        expect(languages.en.categories.FeatureSegment.fields.alluvialFormationProcess.label)
            .toBe('Alluvial formation process');
        expect(languages.en.categories.FeatureSegment.fields.wetlandMicrotopographyRecord.label)
            .toBe('Wetland microtopography record');
        expect(languages.en.categories.Find.fields.termAuthorityStatus.label).toBe('Term authority status');
        expect(languages.en.categories.Find.fields.termSearchMapping.label).toBe('Term search mapping');
        expect(languages.en.categories.Find.fields.artifactHandlingWorkflow.label)
            .toBe('Artifact handling workflow');
        expect(languages.en.categories.Find.fields.findSampleResearchScope.label)
            .toBe('Find/sample research scope');
        expect(languages.en.categories.Find.fields.artifactLabelRegisterLink.label)
            .toBe('Artifact label-register link');
        expect(languages.en.categories.Find.fields.artifactQuantityBasis.label).toBe('Artifact quantity basis');
        expect(languages.en.categories.Find.fields.storageEnvironmentControl.label)
            .toBe('Storage environment control');
        expect(languages.en.categories.Find.fields.surfaceFindHandlingRecord.label)
            .toBe('Surface find handling record');
        expect(languages.en.categories.Find.fields.artifactRecoveryPreservationRisk.label)
            .toBe('Artifact recovery preservation risk');
        expect(languages.en.categories.Find.fields.artifactCleaningDryingControl.label)
            .toBe('Artifact cleaning/drying control');
        expect(languages.en.categories.Find.fields.conservationScienceRequest.label)
            .toBe('Conservation science request');
        expect(languages.en.categories.Find.fields.waterloggedWoodEmergencyStorage.label)
            .toBe('Waterlogged wood emergency storage');
        expect(languages.en.categories.Find.fields.woodenArtifactConditionRecord.label)
            .toBe('Wooden artifact condition record');
        expect(languages.en.categories.Find.fields.lacquerConservationRisk.label)
            .toBe('Lacquer conservation risk');
        expect(languages.en.categories.Find.fields.metalAnalysisRequest.label)
            .toBe('Metal analysis request');
        expect(languages.en.categories.Find.fields.ceramicConservationState.label)
            .toBe('Ceramic conservation state');
        expect(languages.en.categories.Find.fields.paperTextileEmergencyRecovery.label)
            .toBe('Paper/textile emergency recovery');
        expect(languages.en.categories.Find.fields.conservationTreatmentPrincipleReview.label)
            .toBe('Conservation treatment principle review');
        expect(languages.en.categories.Find.fields.ironResidueSubtype.label).toBe('Iron residue subtype');
        expect(languages.en.categories.Find.fields.graveGoodsRitualContext.label)
            .toBe('Grave goods and ritual context');
        expect(languages.en.categories.Find.fields.neolithicSubsistenceEvidence.label)
            .toBe('Neolithic subsistence evidence');
        expect(languages.en.categories.Find.fields.bronzeAgePotteryTerminology.label)
            .toBe('Bronze Age pottery terminology');
        expect(languages.en.categories.Find.fields.ceramicTermScope.label).toBe('Ceramic term scope');
        expect(languages.en.categories.Find.fields.potteryFabricTemperRecord.label)
            .toBe('Pottery fabric and temper record');
        expect(languages.en.categories.Find.fields.potteryTemperFunctionAssessment.label)
            .toBe('Pottery temper function assessment');
        expect(languages.en.categories.Find.fields.potteryProductionLifeRecord.label)
            .toBe('Pottery production life record');
        expect(languages.en.categories.Find.fields.potteryFormingTraceAssessment.label)
            .toBe('Pottery forming trace assessment');
        expect(languages.en.categories.Find.fields.potteryFormingCaution.label)
            .toBe('Pottery forming caution');
        expect(languages.en.categories.Find.fields.potteryProcessDirectionality.label)
            .toBe('Pottery process directionality');
        expect(languages.en.categories.Find.fields.potteryProductionOrganizationEvidence.label)
            .toBe('Pottery production organization evidence');
        expect(languages.en.categories.Find.fields.potteryComparativeReferenceCheck.label)
            .toBe('Pottery comparative reference check');
        expect(languages.en.categories.Find.fields.potteryExperimentalVariableRecord.label)
            .toBe('Pottery experimental variable record');
        expect(languages.en.categories.Find.fields.potteryClassificationBasis.label)
            .toBe('Pottery classification basis');
        expect(languages.en.categories.Find.fields.potteryProvenanceDistributionReview.label)
            .toBe('Pottery provenance and distribution review');
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
        expect(languages.en.categories.Find.fields.interpretationArgument.label).toBe('Interpretation argument');
        expect(languages.en.categories.Sample.fields.findSampleResearchScope.label)
            .toBe('Find/sample research scope');
        expect(languages.en.categories.Sample.fields.sampleCollectionHandling.label)
            .toBe('Sample collection handling');
        expect(languages.en.categories.Sample.fields.pitDwellingScienceSamplingPlan.label)
            .toBe('Pit-dwelling science sampling plan');
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
        expect(languages.en.categories.Sample.fields.humanDnaFieldControl.label)
            .toBe('Human DNA field control');
        expect(languages.en.categories.Sample.fields.organicSoilAnalysisSample.label)
            .toBe('Organic and soil analysis sample');
        expect(languages.en.categories.Sample.fields.destructiveAnalysisDecision.label)
            .toBe('Destructive analysis decision');
        expect(languages.en.categories.Sample.fields.shellMiddenSamplingStrategy.label)
            .toBe('Shell midden sampling strategy');
        expect(languages.en.categories.Sample.fields.paleoenvironmentProxySampling.label)
            .toBe('Paleoenvironment proxy sampling');
        expect(languages.en.categories.Sample.fields.archaeobotanySampleDesign.label)
            .toBe('Archaeobotany sample design');
        expect(languages.en.categories.Sample.fields.plantRemainSamplingMethod.label)
            .toBe('Plant-remain sampling method');
        expect(languages.en.categories.Sample.fields.flotationProcessingRecord.label)
            .toBe('Flotation processing record');
        expect(languages.en.categories.Sample.fields.plantRemainIdentificationRecord.label)
            .toBe('Plant-remain identification record');
        expect(languages.en.categories.Sample.fields.archaeobotanyInterpretationReview.label)
            .toBe('Archaeobotany interpretation review');
        expect(languages.en.categories.Sample.fields.plantRemainNonDetectionAssessment.label)
            .toBe('Plant-remain non-detection assessment');
        expect(languages.en.categories.Sample.fields.faunalRecoverySampling.label)
            .toBe('Faunal recovery and sampling');
        expect(languages.en.categories.Sample.fields.faunalPreservationHandling.label)
            .toBe('Faunal preservation handling');
        expect(languages.en.categories.Sample.fields.zooarchaeologicalIdentification.label)
            .toBe('Zooarchaeological identification');
        expect(languages.en.categories.Sample.fields.boneSurfaceModification.label)
            .toBe('Bone surface modification');
        expect(languages.en.categories.Sample.fields.zooarchaeologicalQuantification.label)
            .toBe('Zooarchaeological quantification');
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
        expect(languages.en.categories.Drawing.fields.mapSourceMaterial.label)
            .toBe('Map source material');
        expect(languages.en.categories.Drawing.fields.historicalMapLandscapeInterpretation.label)
            .toBe('Historical-map landscape interpretation');
        expect(languages.en.categories.Drawing.fields.spatialDrawingProductionWorkflow.label)
            .toBe('Spatial drawing production workflow');
        expect(languages.en.categories.Drawing.fields.distributionMapRequirement.label)
            .toBe('Distribution map requirement');
        expect(languages.en.categories.Drawing.fields.electronicDrawingSourceWorkflow.label)
            .toBe('Electronic drawing source workflow');
        expect(languages.en.categories.Drawing.fields.artifactElectronicDrawingProcedure.label)
            .toBe('Artifact electronic drawing procedure');
        expect(languages.en.categories.Drawing.fields.accessControlTag.label)
            .toBe('Access control tag');
        expect(languages.en.categories.Drawing.fields.mediaRights.label)
            .toBe('Media rights management');
        expect(languages.en.categories.Photo.fields.mediaQualityCheck.label)
            .toBe('Media quality check');
        expect(languages.en.categories.Photo.fields.photoCaptureSafetyReview.label)
            .toBe('Photo capture safety review');
        expect(languages.en.categories.Photo.fields.gpsPhotoLinkRecord.label)
            .toBe('GPS photo-link record');
        expect(languages.en.categories.Photo.fields.accessControlTag.label)
            .toBe('Access control tag');
        expect(languages.en.categories.Photo.fields.mediaRights.label)
            .toBe('Media rights management');
        expect(languages.ko.categories.Operation.fields.fieldRecordQuality.label).toBeDefined();

        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldRecordQuality'].values.immediateRecording.label)
            .toBe('Immediate recording');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationControlSafety']
            .values.machineStrippingDepthControlled.label)
            .toBe('Machine stripping depth controlled');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationControlSafety']
            .values.dailyStrippingCapacityRecorded.label)
            .toBe('Daily stripping capacity recorded');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-excavationControlSafety']
            .values.preWithdrawalRecordAudit.label)
            .toBe('철수 전 기록물 점검');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-personalNotebookArchive'].values.originalSubmitted.label)
            .toBe('Original submitted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogContent'].values.workArea.label)
            .toBe('Work area');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-operationRoleResponsibility']
            .values.safetyLead.label)
            .toBe('Safety lead');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-operationRoleResponsibility']
            .values.complaintCommunicationLead.label)
            .toBe('민원·기관소통 담당');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-siteProtectionSecurity']
            .values.nightSecurity.label)
            .toBe('Night security');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-siteProtectionSecurity']
            .values.temporaryFindStorage.label)
            .toBe('임시유물 보관');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogReview'].values.sameDayWritten.label)
            .toBe('Same-day written');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dailyLogEvidenceRole']
            .values.cumulativeWorkerCount.label)
            .toBe('Cumulative worker count');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSourcePreservation'].values.backupVerified.label)
            .toBe('Backup verified');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSourcePreservation']
            .values.unpublishedDrawingRetained.label)
            .toBe('Unpublished original drawing retained');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-digitalSourcePreservation']
            .values.followUpResearcherAccessLogged.label)
            .toBe('후속연구자 열람 이력');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sampleSurveySuitability']
            .values.betweenTrenchesUncertain.label)
            .toBe('Between-trenches uncertain');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-trialExcavationPurpose']
            .values.detailedExcavationMethodEstimate.label)
            .toBe('Detailed excavation method estimate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-trialTrenchDesign']
            .values.naturalLeveeRiverPerpendicular.label)
            .toBe('Natural-levee river perpendicular');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleolithicSurveyStage']
            .values.trialPitSurvey.label)
            .toBe('Trial-pit survey');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleolithicLocationSource']
            .values.paleosolLayer.label)
            .toBe('Paleosol layer');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-paleolithicFieldCollection']
            .values.oneKgSoilSample.label)
            .toBe('토양시료 1kg');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleolithicTrialPitCoordinateControl']
            .values.candidateLithicImmediateCheck.label)
            .toBe('Candidate lithic immediate check');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleolithicProfileSampleRecord']
            .values.duplicateSample.label)
            .toBe('Duplicate sample');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-paleolithicNonSiteResourceSurvey']
            .values.nearbyStoneSource.label)
            .toBe('주변 석재 공급지');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paleolithicLithicSpatialContext']
            .values.microDebitageWaterSieved.label)
            .toBe('Microdebitage water sieved');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-paleolithicCulturalLayerReview']
            .values.naturalCulturalMismatchChecked.label)
            .toBe('자연층·문화층 불일치 검토');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationScopeDifficultyBasis']
            .values.featureIdentificationDifficulty.label)
            .toBe('Feature identification difficulty');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gisPredictionEvidence'].values.aerialPhotoStereo.label)
            .toBe('Aerial-photo stereo interpretation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gisPredictionFieldVerification']
            .values.missedCandidate.label)
            .toBe('Missed candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyPreparationCheck']
            .values.heritageDistributionMapReady.label)
            .toBe('Heritage distribution map ready');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyFieldSequence']
            .values.boundaryGpsRecorded.label)
            .toBe('Boundary GPS recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyFieldDiary']
            .values.informantContactRecorded.label)
            .toBe('Informant contact recorded');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-surfaceSurveyFieldDiary']
            .values.permanentMarkerRecord.label)
            .toBe('유성펜 기록');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyMapRequirement']
            .values.twoGpsControlPoints.label)
            .toBe('At least two GPS control points');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyHeritageCategory']
            .values.naturalHeritage.label)
            .toBe('Natural heritage');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyScopeDefinition']
            .values.designatedHeritage500mInfluence.label)
            .toBe('Designated heritage 500 m influence zone');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyLowerChronologyReview']
            .values.koreanWarPeriod.label)
            .toBe('Korean War period');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyTeamExpertise']
            .values.specialistReferral.label)
            .toBe('Specialist referral');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceSurveyTimingReview']
            .values.timingRisk.label)
            .toBe('Timing risk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceEvidenceAbsenceAssessment']
            .values.surveyLimit.label)
            .toBe('Survey limit');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-nonSiteResourceSurvey']
            .values.productionRawMaterialCandidate.label)
            .toBe('Production raw material candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialLandformSurvey']
            .values.noSurfaceFindsNotAbsence.label)
            .toBe('No surface finds not absence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-soilMapPredictionVerification']
            .values.soilMapDepthLimitChecked.label)
            .toBe('Soil map depth limit checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-wetlandAnalysisSource']
            .values.preDevelopmentAerialPhoto.label)
            .toBe('Pre-development aerial photo');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-wetlandLandformInterpretation']
            .values.ultraMicroLandformAnalysis.label)
            .toBe('Ultra-micro-landform analysis');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-wetlandSurveyTargeting']
            .values.trialTrenchPointSelected.label)
            .toBe('Trial trench point selected');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicDivisionBasis']
            .values.singleEventDepositKept.label)
            .toBe('Single event deposit kept');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-soilParticleFieldCheck']
            .values.siltClayMudWordingReviewed.label)
            .toBe('Silt/clay/mud wording reviewed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-layerBoundarySurfaceRecord']
            .values.gradualBoundary.label)
            .toBe('Gradual boundary');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-faciesSectionDrawingRecord']
            .values.boundaryLineConventionApplied.label)
            .toBe('Boundary line convention applied');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicMisreadGuard']
            .values.colorPrimaryDivisionAvoided.label)
            .toBe('Color-first division avoided');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-layerNamingSystem']
            .values.featureDetectionSurfaceNumber.label)
            .toBe('Feature-detection surface number');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureFillInterpretation']
            .values.attributionCaution.label)
            .toBe('Attribution caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-naturalHumusRelativity']
            .values.paleolithicCulturalLayerCandidate.label)
            .toBe('Paleolithic cultural layer candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicObservationProcedure']
            .values.observationTimeSufficient.label)
            .toBe('Observation time sufficient');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicObservationProcedure']
            .values.overallStratigraphyFlowPrepared.label)
            .toBe('Overall stratigraphy flow prepared');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureLifecycleReview']
            .values.abandonmentProcess.label)
            .toBe('Abandonment process');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureLifecycleReview']
            .values.findLayerRelationRecorded.label)
            .toBe('Find-layer relation recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureBlockInclusionAssessment']
            .values.collapseDepositCandidate.label)
            .toBe('Collapse deposit candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureBurialProcessAssessment']
            .values.waterlaidDeposit.label)
            .toBe('Waterlaid deposit');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicRelationReview']
            .values.baulkRemovalCrossCheck.label)
            .toBe('Baulk-removal cross-check');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicRelationReview']
            .values.mediaCrossChecked.label)
            .toBe('Photo/drawing cross-checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationContextModel']
            .values.quadrantInvestigation.label)
            .toBe('Quadrant investigation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationReverseSequenceCheck']
            .values.useSurfaceChecked.label)
            .toBe('Use surface checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-soilTextureFieldAssessment']
            .values.quantitativeAnalysisNeeded.label)
            .toBe('Quantitative analysis needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialLayerConceptAudit']
            .values.abLayerSetRecorded.label)
            .toBe('a+b layer set recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialSurfaceAttribution']
            .values.bLayerSurfaceDetection.label)
            .toBe('b-layer surface detection');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-alluvialFormationProcess']
            .values.floodDepositCandidate.label)
            .toBe('Flood deposit candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-wetlandMicrotopographyRecord']
            .values.buriedPaddySoil.label)
            .toBe('Buried paddy soil');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldOnlyMissingCheck'].values.preRemovalCondition.label)
            .toBe('Pre-removal condition');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldOnlyMissingCheck']
            .values.smallFeaturePlotted.label)
            .toBe('Small feature plotted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactHandlingWorkflow'].values.stateVesting.label)
            .toBe('State vesting');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-findSampleResearchScope']
            .values.futureResearchCandidate.label)
            .toBe('Future research candidate');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-findSampleResearchScope']
            .values.notCollectedReasonRecorded.label)
            .toBe('미수습 사유 기록');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactLabelRegisterLink']
            .values.fieldSerialInventoryNumberLinked.label)
            .toBe('Field serial and inventory number linked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactQuantityBasis'].values.sameObjectConfirmed.label)
            .toBe('Same object confirmed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactQuantityBasis'].values.oneLotTenItems.label)
            .toBe('One lot / ten items');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactRecoveryPreservationRisk']
            .values.smallFindLoss.label)
            .toBe('Small find loss');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactCleaningDryingControl']
            .values.recoveryNumberMaintained.label)
            .toBe('Recovery number maintained');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-storageEnvironmentControl']
            .values.currentStandardCrossCheckNeeded.label)
            .toBe('Current standard cross-check needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-storageEnvironmentControl']
            .values.conditionCheckBeforeReport.label)
            .toBe('Condition check before report');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-conservationScienceRequest']
            .values.nonDestructiveFirst.label)
            .toBe('Non-destructive first');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-waterloggedWoodEmergencyStorage']
            .values.c14ImpactReview.label)
            .toBe('C14 impact review');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-woodenArtifactConditionRecord']
            .values.woodSpeciesAnalysisPlanned.label)
            .toBe('Wood-species analysis planned');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-lacquerConservationRisk']
            .values.lacquerFilmCrackingRisk.label)
            .toBe('Lacquer film cracking risk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-metalAnalysisRequest']
            .values.cuttingPolishingApproval.label)
            .toBe('Cutting/polishing approval');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ceramicConservationState']
            .values.wetCleaningCaution.label)
            .toBe('Wet cleaning caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-paperTextileEmergencyRecovery']
            .values.forcedDryingAvoided.label)
            .toBe('Forced drying avoided');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-conservationTreatmentPrincipleReview']
            .values.evidenceDamageAvoided.label)
            .toBe('Evidence damage avoided');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingInvestigationSequence']
            .values.samePhotoStationMaintained.label)
            .toBe('Same photo station maintained');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingSectionStrategy']
            .values.exploratoryTrenchRationale.label)
            .toBe('Exploratory trench rationale');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitFeatureFunctionAssessment']
            .values.functionNotAssumed.label)
            .toBe('Function not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitBuildingLifecycleStage']
            .values.houseBurialCandidate.label)
            .toBe('House-burial candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-settlementFeatureInvestigationProcedure']
            .values.floorInvestigation.label)
            .toBe('Floor investigation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-settlementFeatureInvestigationProcedure']
            .values.finalDrawingAfterDismantling.label)
            .toBe('Final drawing after dismantling');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-settlementFeatureTrenchStrategy']
            .values.minimalTrenchMaxInfo.label)
            .toBe('Minimal trench, maximum information');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-productionProcessSystem']
            .values.kilnLoading.label)
            .toBe('Kiln loading');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-productionSiteAssociatedFacility']
            .values.levigationArea.label)
            .toBe('Levigation area');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironProcessEvidence']
            .values.metallurgicalAnalysisNeeded.label)
            .toBe('Metallurgical analysis needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironProcessRelationCheck']
            .values.previousOutputIdentified.label)
            .toBe('Previous output identified');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ironProcessRelationCheck']
            .values.analysisFeedbackNeeded.label)
            .toBe('Analysis feedback needed');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombSurveyPurpose']
            .values.damageMinimized.label)
            .toBe('Damage minimized');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-moundFillSubdivisionRecord']
            .values.fieldSubdivisionKept.label)
            .toBe('Field subdivision kept');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombMoundOverlapSequence']
            .values.latestBurialExposedFirst.label)
            .toBe('Latest burial exposed first');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombMoundOverlapSequence']
            .values.sharedDitchSequenceChecked.label)
            .toBe('Shared ditch sequence checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stoneCistWallPackingRecord']
            .values.plasterClayRemaining.label)
            .toBe('Plaster clay remaining');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombInteriorRecoveryRecord']
            .values.nearFloorFineInvestigation.label)
            .toBe('Near-floor fine investigation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stoneChamberTombTypology']
            .values.typeNamePending.label)
            .toBe('Type name pending');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombPassageClosureSequence']
            .values.sequenceComparedWithBurial.label)
            .toBe('Sequence compared with burial');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-burialPlatformUseSequence']
            .values.removalReverseSequence.label)
            .toBe('Removal reverse sequence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombRitualDepositRecord']
            .values.constructionStageLinked.label)
            .toBe('Construction stage linked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombRitualDepositRecord']
            .values.inSituPreservationDuringMoundWork.label)
            .toBe('In-situ preservation during mound work');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-graveGoodsRitualContext']
            .values.functionNotAssumed.label)
            .toBe('Function not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-humanRemainsRecoveryAnalysis']
            .values.dnaBeforeTreatment.label)
            .toBe('DNA before treatment');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-humanDnaFieldControl']
            .values.noFieldWashing.label)
            .toBe('No field washing');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-organicSoilAnalysisSample']
            .values.exteriorControlSoil.label)
            .toBe('Exterior control soil');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-destructiveAnalysisDecision']
            .values.analysisApprovalNeeded.label)
            .toBe('Analysis approval needed');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeobotanySampleDesign']
            .values.collectionPointDiversity.label)
            .toBe('Collection point diversity');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-plantRemainSamplingMethod']
            .values.stratifiedRandomSample.label)
            .toBe('Stratified random sample');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-flotationProcessingRecord']
            .values.lightFractionAfterProcessing.label)
            .toBe('Light fraction after processing');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-plantRemainIdentificationRecord']
            .values.identificationConfidence.label)
            .toBe('Identification confidence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-plantRemainIdentificationRecord']
            .values.regionalMasterChronologyChecked.label)
            .toBe('Regional master chronology checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-archaeobotanyInterpretationReview']
            .values.paleoethnobotanyInterpretation.label)
            .toBe('Paleoethnobotany interpretation');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-plantRemainNonDetectionAssessment']
            .values.absenceNotAssumed.label)
            .toBe('Absence not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-faunalRecoverySampling']
            .values.blockSampleDimensionRecorded.label)
            .toBe('Block sample dimension recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-faunalPreservationHandling']
            .values.soilSupportMaintained.label)
            .toBe('Soil support maintained');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-zooarchaeologicalIdentification']
            .values.taxonRecorded.label)
            .toBe('Taxon recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-boneSurfaceModification']
            .values.modificationCauseUnresolved.label)
            .toBe('Modification cause unresolved');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-zooarchaeologicalQuantification']
            .values.singleIndexNotUsed.label)
            .toBe('Single index not used');
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
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryKilnYardFacility']
            .values.formingArea.label)
            .toBe('성형장');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryKilnOperationScale']
            .values.productionQuantityNotAssumed.label)
            .toBe('생산량 단정 금지');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryKilnInterpretationRisk']
            .values.ashDumpAutoLinkBlocked.label)
            .toBe('Ash dump auto-link blocked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-ceramicTermScope']
            .values.hardFiredPotteryTerm.label)
            .toBe('Hard-fired pottery term');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryFabricTemperRecord']
            .values.shellPowderTemper.label)
            .toBe('Shell powder temper');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryTemperFunctionAssessment']
            .values.dryingSpeedControl.label)
            .toBe('건조속도 조절');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryProductionLifeRecord']
            .values.repairReuse.label)
            .toBe('Repair/reuse');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryFormingTraceAssessment']
            .values.stringCutTrace.label)
            .toBe('String-cut trace');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryFormingCaution']
            .values.stringCutNotStandalone.label)
            .toBe('실떼기 단독확정 금지');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryProcessDirectionality']
            .values.oppositeDirection.label)
            .toBe('Opposite direction');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryProductionOrganizationEvidence']
            .values.ethnographicDirectEquationBlocked.label)
            .toBe('민족지 직접등치 금지');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryComparativeReferenceCheck']
            .values.hastyConclusionBlocked.label)
            .toBe('Hasty conclusion blocked');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryExperimentalVariableRecord']
            .values.failureTrace.label)
            .toBe('실패흔');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-potteryClassificationBasis']
            .values.technicalGroupSorted.label)
            .toBe('Technical group sorted');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-potteryProvenanceDistributionReview']
            .values.workshopAttributionUncertain.label)
            .toBe('공방 귀속 불확실');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-beaconPhysicalFacility']
            .values.combustionChamber.label)
            .toBe('Combustion chamber');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-beaconPhysicalFacility']
            .values.extantRemainsConfirmed.label)
            .toBe('현존 유구 확인');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-beaconNetworkOperation'].values.gamgwan.label)
            .toBe('Gamgwan supervisor');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortressBeaconRelation']
            .values.physicalOperationSeparated.label)
            .toBe('Physical and operation separated');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationConstructionEvidence']
            .values.similarPanchukCaution.label)
            .toBe('Similar-panchuk caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationFoundationRecord']
            .values.foundationBeforeWallBody.label)
            .toBe('Foundation before wall body');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationRepairRecord']
            .values.collapsedStoneInventory.label)
            .toBe('Collapsed stone inventory');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fortificationRestorationEvidence']
            .values.yongcheokCandidate.label)
            .toBe('Yongcheok candidate');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fortificationRestorationEvidence']
            .values.onsiteConservationPriority.label)
            .toBe('현장보존 우선');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dictionaryEditorialRule']
            .values.siteTypeNameSeparated.label)
            .toBe('Place and site type separated');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-dictionaryEditorialRule']
            .values.sameHeadwordDomainSeparated.label)
            .toBe('Same headword separated by domain');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-dictionaryEditorialRule']
            .values.chronologyNoThousandsSeparator.label)
            .toBe('연대 천 단위 미사용');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-dictionaryEditorialRule']
            .values.initialSoundVariantLinked.label)
            .toBe('두음법칙 변형 연결');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termAliasRole']
            .values.projectReportName.label)
            .toBe('Project/report name');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termAliasHandling']
            .values.doNotOverwriteObservedTerm.label)
            .toBe('Do not overwrite observed term');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceMaterial']
            .values.originalScript.label)
            .toBe('Original script');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceDomain']
            .values.alluvialSite.label)
            .toBe('Alluvial site');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceDomain']
            .values.archaeobotany.label)
            .toBe('Archaeobotany');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceDomain']
            .values.zooarchaeology.label)
            .toBe('Zooarchaeology');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceVerification']
            .values.directPdfChecked.label)
            .toBe('Direct PDF checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sourceEvidenceUse']
            .values.preventAutoClassification.label)
            .toBe('Prevent auto-classification');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-sourceEvidenceMaterial']
            .values.measurementValue.label)
            .toBe('수치값');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-typologyArgument']
            .values.representativeAttribute.label)
            .toBe('Representative attribute');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-chronologyArgument']
            .values.alternativeChronology.label)
            .toBe('Alternative chronology');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-assemblageRelation']
            .values.accidentalAssociationRisk.label)
            .toBe('Accidental association risk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-interpretationArgument']
            .values.postDepositionalProcessConsidered.label)
            .toBe('Post-depositional process considered');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sampleCollectionHandling'].values.lightShielded.label)
            .toBe('Light-shielded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingScienceSamplingPlan']
            .values.amsRepresentativeContextChecked.label)
            .toBe('AMS representative context checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitDwellingScienceSamplingPlan']
            .values.starchSample.label)
            .toBe('Starch grinding-stone sample');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitDwellingScienceSamplingPlan']
            .values.postInvestigationSampling.label)
            .toBe('조사종료 후 채취');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaEvidenceRole']
            .values.stratigraphicEvidence.label)
            .toBe('Stratigraphic evidence');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaQualityCheck']
            .values.retakeOrRedrawNeeded.label)
            .toBe('Retake or redraw needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaQualityCheck']
            .values.smallFeatureActualShapeShown.label)
            .toBe('Small feature actual shape shown');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaQualityCheck']
            .values.preRecoveryPhotoTaken.label)
            .toBe('Pre-recovery photo taken');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-mediaQualityCheck']
            .values.levelingLinkedForRecovery.label)
            .toBe('레벨링 연계 위치복원');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mapSourceMaterial']
            .values.joseonMap.label)
            .toBe('Joseon-period map');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-historicalMapLandscapeInterpretation']
            .values.naturalLevee.label)
            .toBe('Natural levee');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-spatialDrawingProductionWorkflow']
            .values.coordinateSystemConverted.label)
            .toBe('Coordinate system converted');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-distributionMapRequirement']
            .values.radius500m.label)
            .toBe('500 m radius');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-electronicDrawingSourceWorkflow']
            .values.pointCloudMerged.label)
            .toBe('Point cloud merged');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-electronicDrawingSourceWorkflow']
            .values.fieldResearcherRechecked.label)
            .toBe('Field researcher rechecked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactElectronicDrawingProcedure']
            .values.referencePlaneCreated.label)
            .toBe('Reference plane created');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-photoCaptureSafetyReview']
            .values.ladderTopShootingProhibited.label)
            .toBe('Ladder-top shooting prohibited');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-photoCaptureSafetyReview']
            .values.alternativeCaptureMethod.label)
            .toBe('촬영 대체수단 기록');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gpsSurveyQualityRecord']
            .values.rtkUsed.label)
            .toBe('RTK used');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gpsNmeaRecord']
            .values.hdop.label)
            .toBe('HDOP');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-gpsPhotoLinkRecord']
            .values.currentPositionLinked.label)
            .toBe('Current position linked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldDatabaseOperationRisk']
            .values.dataCompatibilityChecked.label)
            .toBe('Data compatibility checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-fieldDatabaseOperationRisk']
            .values.statisticsAnalysisTested.label)
            .toBe('Statistics and analysis tested');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-fieldDatabaseOperationRisk']
            .values.siteSearchTested.label)
            .toBe('유적검색 확인');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-digitalSurveyQualityControl']
            .values.fieldResultCrossChecked.label)
            .toBe('Field result cross-checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-reportSubmissionWorkflow']
            .values.submissionReceiptRecorded.label)
            .toBe('Submission receipt recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-excavationPermitDocumentSet']
            .values.undergroundExcavationPlanAttached.label)
            .toBe('Underground excavation plan attached');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-reportPreparationReview']
            .values.legendPrepared.label)
            .toBe('Legend prepared');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-reportStandardHistory']
            .values.artifactNumberRuleRecorded.label)
            .toBe('Artifact number rule recorded');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-informationAssetType']
            .values.standardElectronicExcavationReport.label)
            .toBe('Standard electronic excavation report');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-informationAssetManagement']
            .values.dbmsConnectionChecked.label)
            .toBe('DBMS connection checked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stateVestingSelectionRecord']
            .values.stateVestingRegister.label)
            .toBe('State vesting register');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-reportSubmissionWorkflow']
            .values.collaborationPortalEntered.label)
            .toBe('협업포털 입력');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-reportPreparationReview']
            .values.drawingPhotoConsistencyChecked.label)
            .toBe('도면·사진 일치 대조');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-reportStandardHistory']
            .values.reportLegendUpdated.label)
            .toBe('일러두기 갱신');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-informationAssetType']
            .values.surfaceSurveyGis.label)
            .toBe('지표조사 GIS');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-informationAssetManagement']
            .values.conventionalMediaDigitizationNeeded.label)
            .toBe('재래식 매체 디지털화 필요');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-excavationPermitDocumentSet']
            .values.alterationPermitChecked.label)
            .toBe('현상변경허가 확인');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stateVestingSelectionRecord']
            .values.temporaryStorageReceipt.label)
            .toBe('임시보관증');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-publicArchaeologyOutput']
            .values.onlineArchive.label)
            .toBe('Online archive');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-publicEngagementProgram']
            .values.mockExcavationUsed.label)
            .toBe('Mock excavation used');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-accessControlTag']
            .values.lootingRisk.label)
            .toBe('Looting risk');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-mediaRights']
            .values.sensitiveDetailMasked.label)
            .toBe('Sensitive detail masked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-overseasHeritageRisk']
            .values.exportRestriction.label)
            .toBe('Export restriction');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-koreanArchaeologyInstitutionalRisk']
            .values.scientificAnalysisExcluded.label)
            .toBe('과학분석 배제');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-researchRoleAssignment']
            .values.reviewResponsibility.label)
            .toBe('Review responsibility');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-researchProcessBalance']
            .values.interpretationImpactReviewed.label)
            .toBe('Interpretation impact reviewed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-experimentDesign']
            .values.singleRunWarning.label)
            .toBe('Single-run warning');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceFindHandlingRecord']
            .values.adheringSoilPreserved.label)
            .toBe('Adhering soil preserved');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-artifactDrawingRecordMethod']
            .values.measuredDrawing.label)
            .toBeDefined();
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-gpsSurveyQualityRecord']
            .values.rtkUsed.label)
            .toBe('RTK 사용');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-mapSourceMaterial']
            .values.joseonMap.label)
            .toBe('조선시대 지도');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-accessControlTag']
            .values.reviewBeforeRelease.label)
            .toBe('공개 전 검토');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-publicEngagementProgram']
            .values.operatingCostReviewed.label)
            .toBe('운영비 검토');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-experimentDesign']
            .values.failedRunRecorded.label)
            .toBe('실패값 기록');
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
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-productionProcessSystem']
            .values.kilnLoading.label)
            .toBe('요내 재임');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-artifactCleaningDryingControl']
            .values.rapidDryingAvoided.label)
            .toBe('급건조 방지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-featureFillInterpretation']
            .values.attributionCaution.label)
            .toBe('귀속 주의');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicObservationProcedure']
            .values.shadeObservation.label)
            .toBe('그늘 관찰');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicObservationProcedure']
            .values.absoluteDatePlottedOnSection.label)
            .toBe('연대측정값 층위도 표시');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-layerBoundarySurfaceRecord']
            .values.featureDetectionSurface.label)
            .toBe('유구 확인면');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-faciesSectionDrawingRecord']
            .values.ironManganeseColorRendered.label)
            .toBe('산화철·망간 색채표현');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicMisreadGuard']
            .values.postRelatedReduction.label)
            .toBe('말목 주변 환원화');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-featureBurialProcessAssessment']
            .values.soilFormationTrace.label)
            .toBe('토양화 흔적');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicRelationReview']
            .values.baulkRemovalCrossCheck.label)
            .toBe('둑 제거 대조');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicRelationReview']
            .values.mediaCrossChecked.label)
            .toBe('사진·도면 대조');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-moundTrenchInvestigation']
            .values.crossTrench.label)
            .toBe('4분·십자 트렌치');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-moundTrenchInvestigation']
            .values.partialInformationCaution.label)
            .toBe('부분정보 주의');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombMoundOverlapSequence']
            .values.sameOrderPhotoSequence.label)
            .toBe('동일 순서 반복 촬영');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombMoundOverlapSequence']
            .values.sharedDitchSequenceChecked.label)
            .toBe('공유 주구 선후 확인');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombInteriorRecoveryRecord']
            .values.organicDryingAvoided.label)
            .toBe('유기물 건조 방지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stoneChamberTombTypology']
            .values.structureRiteMismatch.label)
            .toBe('묘제·장제 불일치');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombPassageClosureSequence']
            .values.closureStoneBeforeRemoval.label)
            .toBe('폐쇄석 제거 전 기록');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-burialPlatformUseSequence']
            .values.graveGoodsByPlatform.label)
            .toBe('시상별 부장품 위치');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombRitualDepositRecord']
            .values.inSituPreservationDuringMoundWork.label)
            .toBe('봉분 작업 중 원위치 유존');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombRitualDepositRecord']
            .values.redepositionCaution.label)
            .toBe('재퇴적 주의');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitFeatureFunctionAssessment']
            .values.functionNotAssumed.label)
            .toBe('성격 자동판정 금지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitBuildingLifecycleStage']
            .values.refusePitReuse.label)
            .toBe('폐기장 전용');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitDwellingInvestigationSequence']
            .values.thirdExposureRecorded.label)
            .toBe('3차 노출 기록');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitDwellingSectionStrategy']
            .values.partialInformationRiskRecorded.label)
            .toBe('부분 정보 위험 기록');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-surfaceBuildingJudgement']
            .values.raisedFloorBuildingCandidate.label)
            .toBe('Raised-floor building candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-postholeGroupSurvey']
            .values.oneBayOutsideIncluded.label)
            .toBe('One bay outside included');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-foundationTraceRecord']
            .values.cornerstoneExtractionPit.label)
            .toBe('Cornerstone extraction pit');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-foundationTraceRecord']
            .values.noTraceConfirmed.label)
            .toBe('흔적 없음 확인');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-buildingExpertReview']
            .values.reconstructionHypothesisSeparated.label)
            .toBe('Reconstruction hypothesis separated');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-buildingReconstructionEvidence']
            .values.yeongjocheokCandidate.label)
            .toBe('Yeongjocheok candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-buildingProspectionConservationRecord']
            .values.registrationErrorRecorded.label)
            .toBe('Registration error recorded');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-buildingProspectionConservationRecord']
            .values.restorationDeferred.label)
            .toBe('복원 보류');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-alluvialLayerConceptAudit']
            .values.abLayerSetRecorded.label)
            .toBe('a+b층 세트 기록');
    });
});
