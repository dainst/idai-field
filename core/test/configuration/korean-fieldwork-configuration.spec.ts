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
        expect(documentsById['term-alias-dwelling-site-house-place'].resource.termAliasHandling)
            .toContain('doNotOverwriteObservedTerm');
        expect(documentsById['term-authority-dwelling-site'].resource.termSearchMapping)
            .toContain('structureSubtypeSeparated');
        expect(documentsById['term-authority-kiln-site'].resource.termSearchMapping)
            .toContain('doNotMergeToSingleTerm');
        expect(documentsById['term-alias-kiln-site-kiln'].resource.verificationState)
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
        expect(documentsById['segment-pit-building-001-fill-a'].resource.relations.liesWithin)
            .toEqual(['feature-pit-building-001']);
        expect(documentsById['find-pit-building-001-001'].resource.fieldOnlyMissingCheck)
            .toContain('numberedBeforeCollection');
        expect(documentsById['sample-pit-building-001-charcoal-001'].resource.sampleCollectionHandling)
            .toContain('contextMapLinked');
        expect(documentsById['photo-pit-building-001-first-exposure'].resource.reportCrossCheck)
            .toContain('photoRegister');
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
        expect(documentsById['photo-media-gps-001'].resource.gpsPhotoLinkRecord)
            .toContain('currentPositionLinked');
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
        expect(documentsById['daily-log-quality-001'].resource.relations.liesWithin)
            .toEqual(['op-quality-001']);
        expect(documentsById['daily-log-quality-001'].resource.dailyLogEvidenceRole)
            .toContain('disputeEvidencePotential');
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
        expect(documentsById['project-admin-workflow-001'].resource.expertReviewMeeting)
            .toContain('divergentOpinionPreserved');
        expect(documentsById['project-admin-workflow-001'].resource.partialCompletionPackage)
            .toContain('remainingUninvestigatedArea');
        expect(documentsById['project-admin-workflow-001'].resource.recordTransferManagementSystem)
            .toContain('sourceDatabase');
        expect(documentsById['op-admin-review-001'].resource.partialCompletionPackage)
            .toContain('notificationResult');
        expect(documentsById['survey-admin-surface-001'].resource.surfaceSurveyResultProcessing)
            .toContain('digitalRegistration');
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
        expect(documentsById['find-tomb-grave-good-001'].resource.graveGoodsRitualContext)
            .toContain('functionNotAssumed');
        expect(documentsById['find-tomb-grave-good-001'].resource.graveGoodsRitualContext)
            .toContain('relationToHumanRemains');
        expect(documentsById['sample-tomb-human-remains-001'].resource.humanRemainsRecoveryAnalysis)
            .toContain('dnaBeforeTreatment');
        expect(documentsById['sample-tomb-human-remains-001'].resource.humanRemainsRecoveryAnalysis)
            .toContain('analysisCriteriaRecorded');
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
        expect(documentsById['find-waterlogged-lacquer-001'].resource.lacquerConservationRisk)
            .toContain('lacquerFilmCrackingRisk');
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
        expect(termAliasForm.parent).toBe('TermAuthority');
        expect(termAliasForm.fields.termAliasRole.inputType).toBe('checkboxes');
        expect(termAliasForm.fields.termAliasHandling.inputType).toBe('checkboxes');
        expect(operationForm.fields.fieldRecordQuality.inputType).toBe('checkboxes');
        expect(operationForm.fields.gpsSurveyQualityRecord.inputType).toBe('checkboxes');
        expect(operationForm.fields.gpsNmeaRecord.inputType).toBe('checkboxes');
        expect(operationForm.fields.fieldDatabaseOperationRisk.inputType).toBe('checkboxes');
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
        expect(operationForm.fields.expertReviewMeeting.inputType).toBe('checkboxes');
        expect(operationForm.fields.partialCompletionPackage.inputType).toBe('checkboxes');
        expect(operationForm.fields.recordTransferManagementSystem.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyObservation.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyBiasControl.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFollowUp.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyResultProcessing.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyPreparationCheck.inputType).toBe('checkboxes');
        expect(surveyForm.fields.surfaceSurveyFieldSequence.inputType).toBe('checkboxes');
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
        expect(featureForm.fields.pitDwellingExposureBaulk.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFloorFacility.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingFireEvidence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitDwellingOverlapSequence.inputType).toBe('checkboxes');
        expect(featureForm.fields.pitFeatureFunctionAssessment.inputType).toBe('checkboxes');
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
        expect(featureForm.fields.stoneCistWallPackingRecord.inputType).toBe('checkboxes');
        expect(featureForm.fields.tombInteriorRecoveryRecord.inputType).toBe('checkboxes');
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
        expect(featureSegmentForm.fields.stratigraphicDivisionBasis.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.soilParticleFieldCheck.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.layerBoundarySurfaceRecord.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.stratigraphicMisreadGuard.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.layerNamingSystem.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureFillInterpretation.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.stratigraphicObservationProcedure.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureLifecycleReview.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureBlockInclusionAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.featureBurialProcessAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.soilTextureFieldAssessment.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialLayerConceptAudit.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialSurfaceAttribution.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.alluvialFormationProcess.inputType).toBe('checkboxes');
        expect(featureSegmentForm.fields.wetlandMicrotopographyRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.fieldOnlyMissingCheck.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactHandlingWorkflow.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactLabelRegisterLink.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactQuantityBasis.inputType).toBe('checkboxes');
        expect(findForm.fields.surfaceFindHandlingRecord.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactRecoveryPreservationRisk.inputType).toBe('checkboxes');
        expect(findForm.fields.artifactCleaningDryingControl.inputType).toBe('checkboxes');
        expect(findForm.fields.storageEnvironmentControl.inputType).toBe('checkboxes');
        expect(findForm.fields.conservationScienceRequest.inputType).toBe('checkboxes');
        expect(findForm.fields.waterloggedWoodEmergencyStorage.inputType).toBe('checkboxes');
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
        expect(photoForm.fields.mediaEvidenceRole.inputType).toBe('checkboxes');
        expect(photoForm.fields.mediaQualityCheck.inputType).toBe('checkboxes');
        expect(photoForm.fields.digitalSourcePreservation.inputType).toBe('checkboxes');
        expect(photoForm.fields.gpsPhotoLinkRecord.inputType).toBe('checkboxes');
        expect(photoForm.fields.reportCrossCheck.inputType).toBe('checkboxes');

        expect(operationForm.valuelists.fieldRecordQuality).toBe('KoreanFieldwork-fieldRecordQuality');
        expect(operationForm.valuelists.gpsSurveyQualityRecord)
            .toBe('KoreanFieldwork-gpsSurveyQualityRecord');
        expect(operationForm.valuelists.gpsNmeaRecord)
            .toBe('KoreanFieldwork-gpsNmeaRecord');
        expect(operationForm.valuelists.fieldDatabaseOperationRisk)
            .toBe('KoreanFieldwork-fieldDatabaseOperationRisk');
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
        expect(termAliasForm.valuelists.termAliasRole).toBe('KoreanFieldwork-termAliasRole');
        expect(termAliasForm.valuelists.termAliasHandling).toBe('KoreanFieldwork-termAliasHandling');
        expect(termAliasForm.valuelists.termSearchMapping).toBe('KoreanFieldwork-termSearchMapping');
        expect(termAliasForm.valuelists.termAuthorityStatus).toBe('KoreanFieldwork-termAuthorityStatus');
        expect(surveyForm.valuelists.surfaceSurveyObservation).toBe('KoreanFieldwork-surfaceSurveyObservation');
        expect(surveyForm.valuelists.surfaceSurveyBiasControl).toBe('KoreanFieldwork-surfaceSurveyBiasControl');
        expect(surveyForm.valuelists.surfaceSurveyFollowUp).toBe('KoreanFieldwork-surfaceSurveyFollowUp');
        expect(surveyForm.valuelists.surfaceSurveyPreparationCheck)
            .toBe('KoreanFieldwork-surfaceSurveyPreparationCheck');
        expect(surveyForm.valuelists.surfaceSurveyFieldSequence)
            .toBe('KoreanFieldwork-surfaceSurveyFieldSequence');
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
        expect(featureForm.valuelists.pitDwellingExposureBaulk)
            .toBe('KoreanFieldwork-pitDwellingExposureBaulk');
        expect(featureForm.valuelists.pitDwellingFloorFacility)
            .toBe('KoreanFieldwork-pitDwellingFloorFacility');
        expect(featureForm.valuelists.pitDwellingFireEvidence)
            .toBe('KoreanFieldwork-pitDwellingFireEvidence');
        expect(featureForm.valuelists.pitDwellingOverlapSequence)
            .toBe('KoreanFieldwork-pitDwellingOverlapSequence');
        expect(featureForm.valuelists.pitFeatureFunctionAssessment)
            .toBe('KoreanFieldwork-pitFeatureFunctionAssessment');
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
        expect(featureForm.valuelists.stoneCistWallPackingRecord)
            .toBe('KoreanFieldwork-stoneCistWallPackingRecord');
        expect(featureForm.valuelists.tombInteriorRecoveryRecord)
            .toBe('KoreanFieldwork-tombInteriorRecoveryRecord');
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
        expect(featureSegmentForm.valuelists.stratigraphicDivisionBasis)
            .toBe('KoreanFieldwork-stratigraphicDivisionBasis');
        expect(featureSegmentForm.valuelists.soilParticleFieldCheck)
            .toBe('KoreanFieldwork-soilParticleFieldCheck');
        expect(featureSegmentForm.valuelists.layerBoundarySurfaceRecord)
            .toBe('KoreanFieldwork-layerBoundarySurfaceRecord');
        expect(featureSegmentForm.valuelists.stratigraphicMisreadGuard)
            .toBe('KoreanFieldwork-stratigraphicMisreadGuard');
        expect(featureSegmentForm.valuelists.layerNamingSystem)
            .toBe('KoreanFieldwork-layerNamingSystem');
        expect(featureSegmentForm.valuelists.featureFillInterpretation)
            .toBe('KoreanFieldwork-featureFillInterpretation');
        expect(featureSegmentForm.valuelists.stratigraphicObservationProcedure)
            .toBe('KoreanFieldwork-stratigraphicObservationProcedure');
        expect(featureSegmentForm.valuelists.featureLifecycleReview)
            .toBe('KoreanFieldwork-featureLifecycleReview');
        expect(featureSegmentForm.valuelists.featureBlockInclusionAssessment)
            .toBe('KoreanFieldwork-featureBlockInclusionAssessment');
        expect(featureSegmentForm.valuelists.featureBurialProcessAssessment)
            .toBe('KoreanFieldwork-featureBurialProcessAssessment');
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
        expect(photoForm.valuelists.mediaEvidenceRole).toBe('KoreanFieldwork-mediaEvidenceRole');
        expect(photoForm.valuelists.mediaQualityCheck).toBe('KoreanFieldwork-mediaQualityCheck');
        expect(photoForm.valuelists.digitalSourcePreservation)
            .toBe('KoreanFieldwork-digitalSourcePreservation');
        expect(photoForm.valuelists.gpsPhotoLinkRecord)
            .toBe('KoreanFieldwork-gpsPhotoLinkRecord');
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
        expect(languages.en.categories.TermAlias.label).toBe('Term alias');
        expect(languages.en.categories.TermAlias.fields.termAliasRole.label).toBe('Alias role');
        expect(languages.en.categories.TermAlias.fields.termAliasHandling.label).toBe('Alias handling');
        expect(languages.en.categories.Operation.fields.fieldRecordQuality.label).toBe('Field record quality');
        expect(languages.en.categories.Operation.fields.personalNotebookArchive.label).toBe('Personal notebook archive');
        expect(languages.en.categories.Operation.fields.dailyLogContent.label).toBe('Daily work log');
        expect(languages.en.categories.Operation.fields.dailyLogReview.label).toBe('Daily log review');
        expect(languages.en.categories.Operation.fields.gpsSurveyQualityRecord.label)
            .toBe('GPS survey quality record');
        expect(languages.en.categories.Operation.fields.gpsNmeaRecord.label)
            .toBe('GPS NMEA record');
        expect(languages.en.categories.Operation.fields.fieldDatabaseOperationRisk.label)
            .toBe('Field database operation risk');
        expect(languages.en.categories.Project.fields.digitalSourcePreservation.label).toBe('Digital source preservation');
        expect(languages.en.categories.Project.fields.reportEvaluationFeedback.label)
            .toBe('Report evaluation feedback');
        expect(languages.en.categories.Survey.fields.surfaceSurveyObservation.label)
            .toBe('Surface survey observation');
        expect(languages.en.categories.Survey.fields.surfaceSurveyPreparationCheck.label)
            .toBe('Surface survey preparation check');
        expect(languages.en.categories.Survey.fields.surfaceSurveyFieldSequence.label)
            .toBe('Surface survey field sequence');
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
        expect(languages.en.categories.Feature.fields.firstExposureRecord.label).toBe('First exposure record');
        expect(languages.en.categories.Feature.fields.pitDwellingExposureBaulk.label)
            .toBe('Pit dwelling exposure and baulk');
        expect(languages.en.categories.Feature.fields.pitDwellingFireEvidence.label)
            .toBe('Burned pit dwelling evidence');
        expect(languages.en.categories.Feature.fields.pitFeatureFunctionAssessment.label)
            .toBe('Pit feature function assessment');
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
        expect(languages.en.categories.Feature.fields.stoneCistWallPackingRecord.label)
            .toBe('Stone cist wall and packing record');
        expect(languages.en.categories.Feature.fields.tombInteriorRecoveryRecord.label)
            .toBe('Tomb interior recovery record');
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
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicDivisionBasis.label)
            .toBe('Stratigraphic division basis');
        expect(languages.en.categories.FeatureSegment.fields.soilParticleFieldCheck.label)
            .toBe('Soil particle field check');
        expect(languages.en.categories.FeatureSegment.fields.layerBoundarySurfaceRecord.label)
            .toBe('Layer boundary surface record');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicMisreadGuard.label)
            .toBe('Stratigraphic misread guard');
        expect(languages.en.categories.FeatureSegment.fields.layerNamingSystem.label)
            .toBe('Layer naming system');
        expect(languages.en.categories.FeatureSegment.fields.featureFillInterpretation.label)
            .toBe('Feature fill interpretation');
        expect(languages.en.categories.FeatureSegment.fields.stratigraphicObservationProcedure.label)
            .toBe('Stratigraphic observation procedure');
        expect(languages.en.categories.FeatureSegment.fields.featureLifecycleReview.label)
            .toBe('Feature lifecycle review');
        expect(languages.en.categories.FeatureSegment.fields.featureBlockInclusionAssessment.label)
            .toBe('Feature block inclusion assessment');
        expect(languages.en.categories.FeatureSegment.fields.featureBurialProcessAssessment.label)
            .toBe('Feature burial process assessment');
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
        expect(languages.en.categories.Photo.fields.mediaQualityCheck.label)
            .toBe('Media quality check');
        expect(languages.en.categories.Photo.fields.gpsPhotoLinkRecord.label)
            .toBe('GPS photo-link record');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-sampleSurveySuitability']
            .values.betweenTrenchesUncertain.label)
            .toBe('Between-trenches uncertain');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-trialExcavationPurpose']
            .values.detailedExcavationMethodEstimate.label)
            .toBe('Detailed excavation method estimate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-trialTrenchDesign']
            .values.naturalLeveeRiverPerpendicular.label)
            .toBe('Natural-levee river perpendicular');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicMisreadGuard']
            .values.colorPrimaryDivisionAvoided.label)
            .toBe('Color-first division avoided');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-layerNamingSystem']
            .values.featureDetectionSurfaceNumber.label)
            .toBe('Feature-detection surface number');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureFillInterpretation']
            .values.attributionCaution.label)
            .toBe('Attribution caution');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stratigraphicObservationProcedure']
            .values.observationTimeSufficient.label)
            .toBe('Observation time sufficient');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureLifecycleReview']
            .values.abandonmentProcess.label)
            .toBe('Abandonment process');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureBlockInclusionAssessment']
            .values.collapseDepositCandidate.label)
            .toBe('Collapse deposit candidate');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-featureBurialProcessAssessment']
            .values.waterlaidDeposit.label)
            .toBe('Waterlaid deposit');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactHandlingWorkflow'].values.stateVesting.label)
            .toBe('State vesting');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactLabelRegisterLink']
            .values.fieldSerialInventoryNumberLinked.label)
            .toBe('Field serial and inventory number linked');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactQuantityBasis'].values.sameObjectConfirmed.label)
            .toBe('Same object confirmed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactRecoveryPreservationRisk']
            .values.smallFindLoss.label)
            .toBe('Small find loss');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactCleaningDryingControl']
            .values.recoveryNumberMaintained.label)
            .toBe('Recovery number maintained');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-storageEnvironmentControl']
            .values.currentStandardCrossCheckNeeded.label)
            .toBe('Current standard cross-check needed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-conservationScienceRequest']
            .values.nonDestructiveFirst.label)
            .toBe('Non-destructive first');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-waterloggedWoodEmergencyStorage']
            .values.c14ImpactReview.label)
            .toBe('C14 impact review');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-pitFeatureFunctionAssessment']
            .values.functionNotAssumed.label)
            .toBe('Function not assumed');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-settlementFeatureInvestigationProcedure']
            .values.floorInvestigation.label)
            .toBe('Floor investigation');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-stoneCistWallPackingRecord']
            .values.plasterClayRemaining.label)
            .toBe('Plaster clay remaining');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-tombInteriorRecoveryRecord']
            .values.nearFloorFineInvestigation.label)
            .toBe('Near-floor fine investigation');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termAliasRole']
            .values.projectReportName.label)
            .toBe('Project/report name');
        expect(valuelistLanguages.projects.en['KoreanFieldwork-termAliasHandling']
            .values.doNotOverwriteObservedTerm.label)
            .toBe('Do not overwrite observed term');
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
        expect(valuelistLanguages.projects.en['KoreanFieldwork-artifactElectronicDrawingProcedure']
            .values.referencePlaneCreated.label)
            .toBe('Reference plane created');
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
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-layerBoundarySurfaceRecord']
            .values.featureDetectionSurface.label)
            .toBe('유구 확인면');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-stratigraphicMisreadGuard']
            .values.postRelatedReduction.label)
            .toBe('말목 주변 환원화');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-featureBurialProcessAssessment']
            .values.soilFormationTrace.label)
            .toBe('토양화 흔적');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-moundTrenchInvestigation']
            .values.partialInformationCaution.label)
            .toBe('부분정보 주의');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-tombInteriorRecoveryRecord']
            .values.organicDryingAvoided.label)
            .toBe('유기물 건조 방지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-pitFeatureFunctionAssessment']
            .values.functionNotAssumed.label)
            .toBe('성격 자동판정 금지');
        expect(valuelistLanguages.projects.ko['KoreanFieldwork-alluvialLayerConceptAudit']
            .values.abLayerSetRecorded.label)
            .toBe('a+b층 세트 기록');
    });
});
