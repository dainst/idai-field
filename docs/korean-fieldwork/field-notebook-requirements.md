# 한국형 야장 구현 요구사항

이 문서는 `조사방법론` 강의자료와 `고고학사전` 자료군을 iDAI.field 구현 과제로 압축한 요구사항이다. 원문 요약이 아니라, 한국 현장에서 조사자가 놓치면 안 되는 기록 흐름을 기능 단위로 정리한다.

## 요구사항 선별 기준

필수 입력값으로 승격하는 기준은 다음 네 가지다.

1. 현장 종료 뒤 복구하기 어려운 관찰값이다.
2. 보고서, 도면, 사진대장, 유물대장, 시료분석표, 행정 제출물로 직접 이어진다.
3. 조사단계 전환, 보존조치, 국가귀속, 후속기관 인계처럼 책임 소재가 남는 업무다.
4. 해석을 확정하기 전에 판단 보류와 대안 검토가 필요한 값이다.

사전 표제어와 강의자료 용어는 검색·자동완성·보고서 출력에는 적극 쓰되, 위 기준을 만족하지 않으면 현장 필수값으로 만들지 않는다.

## 구현 요구

| 요구사항 | 현장 의미 | iDAI.field 구현 형태 |
| --- | --- | --- |
| 조사사업 생애주기 | 한국 매장문화재 조사는 의뢰, 사전자료, 답사, 허가, 착수, 조사, 완료, 보고, 보존조치, 귀속·이관이 이어지는 업무다. | `InvestigationProject` 타임라인에 허가, 변경·기간연장, 완료신고, 전자행정, 협업포털, 결과통보, 인계 이벤트를 둔다. |
| 현장기록 품질검수 | 좋은 야장은 개인 메모가 아니라 즉시성, 사실/해석 분리, 교차검토가 가능한 공적 기록이다. | `FieldRecordQualityReview`를 두고 작성자, 담당 유구, 작성시점, 검토자, 사실/해석 분리, 수정 근거를 저장한다. |
| 현장시에만 가능한 값 경고 | 층 경계, 수습 전 상태, 사진 각도, 표본 위치처럼 나중에 되돌릴 수 없는 값이 있다. | `RecordCreationTiming`으로 기록 시점을 구분하고, `fieldOnlyMissingCheck`와 `firstExposureRecord`를 필수값으로 두어 기존 `missingMandatoryFields` 경고가 빈 기록을 잡게 한다. |
| 보고서 역산 | 보고서 초록, 도면 목록, 사진대장, 유물·시료 목록은 나중에 따로 만드는 문서가 아니라 현장기록에서 생성되어야 한다. | `ReportPreparationReview`와 `ReportEditorialCrossCheck`가 원고, 도면, 사진, 일지, 목록, 번호 변환표의 불일치를 원기록 ID와 연결한다. |
| 보고서 평가 환류 | 보고서 평가표는 반복 오류와 보완 요구를 잡아내는 장치지만, 현장 품질을 완전히 대신하지는 못한다. | `ReportEvaluationApplicabilityReview`와 `ReportFieldQualityFeedback`이 자체평가·위원회평가 차이, 비해당 항목, 적용 제외 근거, 원기록 보완 작업을 연결한다. |
| 조사단계 전환과 인계 | 지표·표본·시굴·정밀발굴은 단절된 프로젝트가 아니라 판단과 자료가 이어지는 단계다. | `InvestigationStageTransition`과 `InvestigationRecordHandover`에 앞 단계 기록, 출토유물, 약식보고서, 후속기관, 최종보고서 연결을 둔다. |
| 행정·보존 이행 | 보존조치는 결정으로 끝나지 않고 이행, 통보, 관리주체, 점검, 재평가로 이어진다. | `PreservationDecisionPackage`, `PermitConditionComplianceRecord`, `ReportSubmissionWorkflow`, `StateVestingSelectionRecord`를 조사사업 카드에 연결한다. |
| 질문형 유구 야장 | 유구명만 고르는 방식은 수혈주거지, 고분, 성곽, 생산유구의 조사 과정을 설명하지 못한다. | 유구 유형별 카드에는 단계별 질문, 확인 전제, 대안 해석, 사진·도면·시료 연결을 둔다. 1차 구현은 `Feature`의 수혈건물지 노출·둑, 바닥·시설, 화재 증거, 중복 선후관계 체크리스트로 시작한다. |
| 층위와 유구 형성과정 | 토색이나 층명만으로 층을 확정하면 산화·환원, 교란, 후퇴적 변형을 오인할 수 있다. | `StratigraphicDecisionRecord`, `FeatureFillFormationRecord`, `StratigraphicMisreadGuard`를 두고 층 구분 근거와 쓰지 않은 세분 근거를 남긴다. |
| 매체의 기록 단위화 | 사진, 도면, 3D, GPS, GIS는 첨부파일이 아니라 판단 근거다. | 매체마다 목적, 대상, 방향, 기준점, 좌표계, 품질, 후처리, 재촬영·재실측 필요 여부를 가진다. |
| 분석 목적 기반 시료 | 자연과학 시료는 분석명보다 어떤 질문을 검토하는지가 먼저다. | `PaleoenvironmentSample`, `PitDwellingScienceSamplingPlan`, `ArchaeobotanySamplingPlan` 등에서 채취 시점, 위치 도면, 대표성, 오염·빛·수분 통제, 분석 질문을 필수 후보로 둔다. |
| 유물·시료 생애주기 | 수습 뒤 목록 작성으로 끝나지 않고 응급처치, 포장, 임시보관, 보존처리, 국가귀속, 이관이 이어진다. | `ArtifactHandlingWorkflow`와 `ArtifactCustodyAndStorageWorkflow`가 수습 전 상태부터 이송·수장 환경까지 추적한다. |
| 유물 수량과 수장 기준 | 국가귀속·이관용 수량은 파편 수가 아니라 행정 건수, 물리 점수, 동일개체·부속구 판단, 실수량 병기가 결합된 값이다. | `ArtifactQuantityBasis`가 `건/점/실수량/구성품/근거사진`을 분리하고, `StorageEnvironmentProfile`이 재질별 온습도·조도·오염물 기준과 실측값을 저장한다. |
| 용어 권위와 검색 분리 | 전문사전 표제어, 기관 관용어, 한자·원어 색인은 모두 필요하지만 저장값으로 바로 합치면 안 된다. | `TermAuthority`, `TermAlias`, `TermRelationship`을 두고 검색어·보고서출력어·우선표제어·검증상태를 분리한다. |
| 일반 용어와 전문 용어 매핑 | 현장에서는 집자리, 고인돌, 조개더미, 돌방무덤처럼 익숙한 말을 쓰지만 보고서와 전문사전은 주거지, 지석묘, 패총, 석실묘처럼 다른 표제어를 쓰기도 한다. | `TermImportMapping`이 입력어, 권위표제어, 보고서출력어, 구조 하위유형, 추정상태, 검증상태를 연결한다. |
| 유적 유형별 패키지 | 하나의 거대 양식은 현장에서 느리고, 단순 공통 양식은 전문 관찰값을 빠뜨린다. | 공통 핵심 카드 위에 구석기·패총·건물지·고분·생산유적·성곽·충적지·제철유적 패키지를 붙인다. |
| 성곽 부속시설 세분 | 성문·암문·수문·수구·여장·해자는 이름만 남기면 방어와 배수 기능, 폐쇄장치, 수리 이력이 사라진다. | `FortificationGateFacility`와 `FortificationWaterFacility`가 오성지·누조·누혈·장군목·장군석, 수문·수구·은구, 왜성 해자의 물 유무·배치 방향·기능을 부재 단위로 저장한다. |
| 생산유적 세부 패키지 | 기와가마·토기가마·자기가마·제철유적은 요체 하나가 아니라 원료, 작업장, 부위별 조사, 폐기장, 분석시료, 소비지 비교가 맞물린 생산 체계다. | `KilnYardSystem`, `TileKilnInvestigation`, `ProductionSampleReliability`, `ProductionConsumptionLink`처럼 생산공간, 부위별 수습, 연대·태토분석 신뢰도, 생산지-소비지 대조를 분리한다. |
| 생산유적 용어 정규화 | `가마/요/요지`, `노/로`, `철재/슬래그`를 같은 단어로 합치면 현장 원문과 공정 판단 근거가 사라진다. | `ProductionTermNormalization`, `IronProcessClassification`, `IronResidueSubtype`이 입력어, 우선표제어, 생산분야, 공정후보, 분석후확정을 분리한다. |
| 형식·편년 논증 | 형식명과 시대값은 관찰값이 아니라 속성, 층위, 공반, 기존 편년안, 대안 검토가 결합된 해석이다. | `typologyArgument`, `chronologyArgument`, `assemblageRelation`으로 대표 속성, 변이, 공반 관계, 전승품·재사용 위험, 대안 편년, 채택 근거를 남긴다. |
| 위험값과 판단 보류 | 후보석기 폐기, 구석기 가능층 누락, 후대 혼입, 대형자료 선별, 색조 오인 같은 위험은 조사 결과를 바꾼다. | `Risk/Uncertainty` 필드를 공통화하고 검토 완료 전에는 기록을 닫지 않게 한다. |

## 첫 구현 단위

1. `KoreanFieldwork-*` 공통 값 목록: 기록 생성 시점, 검증상태, 현장기록 품질, 현장시점 누락점검, 최초 노출 기록, 수혈건물지 노출·둑, 수혈건물지 바닥·시설, 화재 수혈건물지 증거, 중복 수혈건물지 선후, 제철 공정 근거, 제철 노 구조, 제철 부산물 세분, 제철 시료 분석계획, 일일 작업기록, 일지 증거 역할, 일지 검토, 개인 야장 공적기록화, 디지털 원자료 보존, 조사 행정 흐름, 허가조건 이행, 보존조치 이행, 조사자료 인계, 용어관계, 용어 검색·매핑, 용어 검증상태, 사전 분야, 용어 적용범위, 출처 우선순위, 지표조사 현장관찰, 지표조사 편향방지, 지표조사 후속조치, 표본조사 적합성, 시굴조사 목적, 시굴 트렌치 설계, 정밀발굴 범위·난이도 근거, GIS·항공사진 예측근거, 예측 현장검증, 유물 관리 절차, 유물 건·점수 산정, 수장환경 관리, 유적 패키지, 형식 논증, 편년 논증, 공반 관계, 시료 목적, 시료 채취·보관, 식물고고학 시료 설계, 식물유체 표본추출, 플로테이션 처리기록, 식물유체 동정기록, 식물고고학 해석검토, 식물유체 미검출 평가, 매체 증거 역할, 매체 품질검수, 보고서 교차검토, 보고서 평가 환류
2. 독립 `FieldRecordQualityReview`, `DailyLog`, `TermAuthority` 1차 카드
3. `InvestigationProject` 행정 타임라인
4. `fieldOnlyMissingCheck`와 `firstExposureRecord` 필수값 경고
5. `ReportPreparationReview`와 도면·사진·목록 교차검토
6. `InvestigationStageTransition`과 후속기관 인계
7. `TermAuthority` 기반 한국어 용어 검색과 자동완성
8. `typologyArgument`, `chronologyArgument`, `assemblageRelation` 기반 형식·편년 판단근거

`Config-KoreanFieldwork`는 1차 공통 값 목록을 Project, Operation, Survey, FeatureGroup, Feature, FeatureSegment, Find, Sample, Drawing, Photo 화면에 배치한다. 현장기록 품질은 각 기록 단위에, 현장시점 누락점검은 `Feature`, `FeatureSegment`, `Find`, `Sample`에, 최초 노출 기록은 `Feature`와 `FeatureSegment`에 배치했다. `fieldOnlyMissingCheck`와 `firstExposureRecord`는 해당 화면의 필수값으로 지정해 값이 없으면 기존 필수값 경고 흐름에 잡히게 했다. 수혈건물지·수혈주거지 강의자료에서 반복되는 어깨선, 둑 설정, 단면 보양, 바닥면·내부시설, 화재 증거, 중복 선후관계는 `pitDwellingExposureBaulk`, `pitDwellingFloorFacility`, `pitDwellingFireEvidence`, `pitDwellingOverlapSequence`로 `Feature`에 배치해 유형명 확정보다 조사 과정의 증거를 먼저 남기게 했다. 제철유적은 `ironProcessEvidence`와 `ironFurnaceStructure`를 `Feature`에, `ironResidueSubtype`을 `Find`에, `ironSampleAnalysisPlan`을 `Sample`에 배치해 노 형태, 송풍·배재 구조, 부산물 세분, 금속학 분석계획을 공정 확정 전에 따로 남기게 했다. 고분은 `tombMoundInvestigation`과 `tombBurialStructureInvestigation`을 `Feature`에 배치해 봉토·분구의 구지표, 성토 단위, 조사둑, 주구, 보존구역과 매장주체부의 묘광, 관·곽·실, 개석, 밀봉토, 폐쇄시설, 추가장·도굴 근거를 나누어 기록하게 했다. 부장품과 제사자료는 `graveGoodsRitualContext`로 `Find`에 배치해 착장, 관 내부·외부, 봉토·주구, 입구·폐쇄부, 의도적 파손, 동물·음식 공헌, 외래요소 후보, 인골과의 위치관계를 유물 카드에서 바로 남기게 했다. 인골은 `humanRemainsRecoveryAnalysis`로 `Sample`에 배치해 전문가 협의, 보존처리 전 DNA, 핀폴 보링 금지, 약한 도구, 차양, 물 사용 제한, 1/5 도면, 포장·주기, 장기건조, 개체식별과 분석 기준을 이어서 기록하게 했다. 일일 작업기록과 일지 검토는 `diaryAbstract`가 있는 `Operation`에 먼저 배치하고, 독립 `DailyLog`는 `Operation` 하위 카드로 두어 당일 사실기록, 누적 조사원·인부·장비 수, 날씨·우천작업, 위원회·전문가 검토회의, 발주처·기관 소통, 분쟁 증거 가능성을 별도 기록하게 했다. 개인 야장 공적기록화는 `Operation`에, 디지털 원자료 보존은 `Project`와 `Operation`에 우선 배치했다. 독립 `FieldRecordQualityReview`는 `Operation` 하위 카드로 두어 검수 대상 기록, 검수 단계, 수정·보완 근거를 별도 기록하게 했다. 독립 `TermAuthority`는 `FeatureGroup` 하위 카드로 두어 사전 분야, 적용범위, 출처 우선순위, 용어 관계, 검색 매핑, 검증상태를 한 곳에서 관리하게 했다. 조사 행정 흐름, 허가조건 이행, 보존조치 이행은 `Project`에, 조사자료 인계는 `Project`와 `Operation`에 배치해 표본·시굴·정밀발굴 사이의 기록 이동을 끊기지 않게 했다. 보고서 교차검토와 보고서 평가 환류는 `Project`와 `Operation`에 함께 배치해 원고·도면·사진·목록 대조와 자체평가·위원회평가 차이, 비해당 항목, 보완요구 추적이 조사 단위와 사업 단위에서 모두 남도록 했다. `Survey`에는 지표조사를 유적 확정 절차가 아니라 현장관찰, 편향방지, 후속조치 판단근거로 관리하는 세 목록과 표본조사 적합성, 시굴조사 목적, 시굴 트렌치 설계, 정밀발굴 범위·난이도 근거, GIS·항공사진 예측근거, 예측 현장검증 목록을 배치했다. `FeatureGroup`, `Feature`, `FeatureSegment`, `Find`에는 용어 관계, 용어 검색·매핑, 사전 근거, OCR 교정 필요, 원PDF 대조 완료, 값목록 후보, UI 노출 보류를 표시하는 용어 검증상태를 배치했다. `Find`에는 `artifactHandlingWorkflow`, `artifactQuantityBasis`, `storageEnvironmentControl`을 배치해 현장수습, 응급처치, 건·점수 산정, 동일개체·부속구 판단, 재질별 수장환경을 유물 카드에서 바로 추적하게 했다. `Feature`와 `Find`에는 형식 논증, 편년 논증, 공반 관계를 함께 배치하고, `FeatureSegment`에는 최소한 편년 논증을 배치해 시대·형식값이 근거 없이 확정되지 않게 했다. Sample 화면에는 시료 목적, 빛·수분·오염·위치도면 연결 조건, 제철 시료 분석계획, 식물유체 표본설계·처리·동정·해석·미검출 평가를 배치했다. Drawing과 Photo 화면에는 `mediaEvidenceRole`, `mediaQualityCheck`, `digitalSourcePreservation`, `reportCrossCheck`를 배치해 방향·축척·기준점·원본 보존·대장번호 대조·보고서 도판 후보 여부를 매체 자체에서 점검하게 했다. 성곽 보강분 중 성문·방어 부속시설, 암문 기능, 여장 세부, 수문·수구, 왜성 해자는 `Feature` 화면의 첫 전문 값 목록으로 옮겼다.

보존과학 보강분은 `Find`에 `conservationScienceRequest`, `waterloggedWoodEmergencyStorage`, `lacquerConservationRisk`, `metalAnalysisRequest`, `ceramicConservationState`, `paperTextileEmergencyRecovery`, `conservationTreatmentPrincipleReview`를 배치하고, `Sample`에 `humanDnaFieldControl`, `organicSoilAnalysisSample`, `destructiveAnalysisDecision`을 배치했다. 출토 순간부터 분석 의뢰까지 보존과학이 유물 해석을 바꿀 수 있으므로 의뢰목적, 재질, 출토맥락, 비파괴 우선 여부, 파괴시료 승인, 잔여시료 보관, 수침목재의 차광·냉암소·표면약제 영향, 칠도막 갈라짐, 금속 분석 위치와 절단·연마 승인, 토도류 염결정·수화·물세척 주의, 지류·직물의 공기·빛·온습도 변화, 보존처리의 원형·증거·가역성 검토, 인골 DNA 접촉자·세척금지·분석실 인계, 내부토/대조토와 분석 질문을 같은 기록 흐름에서 남긴다.

유물실측 보강분은 `Drawing`에 `artifactDrawingRecordMethod`, `artifactDrawingPlan`, `artifactDrawingQualityCheck`, `potteryDrawingStandard`, `stoneToolDrawingView`, `waterloggedWoodDrawingHandling`을 배치했다. 실측을 유물 외곽선 복사가 아니라 기술·사진·탁본·실측·3D스캔·현미경사진이 결합된 기록으로 보고, 재질·기종·잔존상태·기능, 기준선·실측선·투상법·도면배치·축척·도구, 측점 검점·교정·사진/탁본 대조·보존처리 전후 대조·재실측 필요를 Drawing 카드에 남기게 했다. 토기는 정치상태, 단면 우선, 기벽두께 3-4점, 문양 측점을, 석기는 사용방향 정치와 제3각법 6면·전개도·타제/고타/마연흔을, 수침목재는 습식 제도와 보존처리 전후·분무수분·물상자·건조수축 위험을 따로 확인한다.

패총·신석기 보강분은 `Feature`에 `shellMiddenStratigraphy`와 `shellMiddenSettlementContext`를 배치해 패총층 유형, 재퇴적·교란, 평면·단면 병행, 하부·관입 유구, 집락 전체 조사구획, 주거지·노지·저장공·매장·의례·밭 후보와 해안·수계 맥락을 함께 남기게 했다. `Find`에는 `neolithicSubsistenceEvidence`를 두어 어망추, 조침, 작살, 골제·패제 어로구, 통나무배, 외양성 어종, 해양포유류, 직접·간접 포경 근거, 어종과 해류의 계절성, 교류품 후보를 유물 카드에서 기록한다. `Sample`에는 `shellMiddenSamplingStrategy`와 `paleoenvironmentProxySampling`을 배치해 층위별 벌크·블록시료, 물체질·부유선별, 패류·어골·동물뼈·식물유체 분리, 화분·규조·식물규산체·탄화곡물·목탄·패류·유공충 프록시, 연대 전처리와 지역 해수면 곡선 연결을 추적한다. 식물유체·탄화곡물 보강분은 `archaeobotanySampleDesign`, `plantRemainSamplingMethod`, `flotationProcessingRecord`, `plantRemainIdentificationRecord`, `archaeobotanyInterpretationReview`, `plantRemainNonDetectionAssessment`로 `Sample`에 배치해 연구질문, 표본추출 방식, 플로테이션 처리 조건, 동정 신뢰도, 분석/해석 분리, 미검출의 조건을 시료 카드에서 직접 관리하게 했다.

청동기 보강분은 `Feature`에 `bronzeAgeDwellingEvidence`, `dolmenStructureContext`, `bronzeAgeEnclosureInterpretation`을 배치해 송국리식·가락동식 같은 유형명을 관찰값 뒤의 후보로 두고, 평면형·화덕·중앙 타원형 구덩이·양단 주혈·벽도랑·주거군/묘역 관계, 고인돌의 덮개돌·받침돌·무덤방·묘역시설·성혈·알구멍·이전복원 이력, 환호의 방어·경계·배수·의례 후보와 내부퇴적·재굴착·수축흔을 분리해 남기게 했다. `Find`에는 `bronzeAgePotteryTerminology`를 두어 민무늬토기/무문토기, 구순각목/골아가리, 공렬/구멍무늬, 이중구연/겹아가리 같은 이칭과 표준 용어, 편년·공반 맥락을 유물 카드에서 추적한다.

충적지·토양도 보강분은 `Survey`에 `alluvialLandformSurvey`와 `soilMapPredictionVerification`을 배치해 자연제방·배후습지·구하도·구해안선·근현대 형질변경, 보링·주상도, 표면유물 부재의 한계, 토양통·대토양군·정밀토양도 반영깊이, 실제 시굴 결과와 예측 수정 사유를 지표조사 단계에서 남기게 했다. `FeatureSegment`에는 `alluvialLayerConceptAudit`, `alluvialSurfaceAttribution`, `alluvialFormationProcess`를 두어 a+b층 세트, 토양층위/퇴적층위/고고학 층명 구분, 구지표면·생활면·유구축조면·검출면, b층 상면 검출, 암색대·이질토 블록·라미나·홍수퇴적 같은 형성과정 근거를 층 세부단위에서 바로 점검한다.

경작유구 보강분은 `Feature`에 `cultivationFeatureContext`, `cultivationTrialTrenchStrategy`, `cultivationFeatureEvidence`, `cultivationChronologyAnalysis`를 배치했다. 입지·맥락에서는 구릉지/충적지 고저, 자연제방·배후습지·곡저부 후보, 경지정리와 과거 항공사진, 관개시설, 물관리 방식을 남기고, 작물명만으로 논·밭을 확정하지 않게 했다. 시굴 트렌치에서는 고랑·이랑 또는 논둑과 직교하는지, 경작면 고저차와 층 경계를 확인했는지, 보조 트렌치·분포 범위·기간·안전을 기록한다. 판정 근거는 논둑·논면, 밭 두둑·고랑, 기능면과 기능 후 퇴적층, 라미나·이질토 블록·단립구조·경작구흔·뿌리흔·식물규산체·산화철망간을 분리한다. 연대·분석은 경작층 포함 유물, 선별 평면조사, AMS/OSL, 식물규산체·식물유체·토양미세형태·지방산 시료, 주거지·야외노지·수혈과의 관계를 한 흐름에서 추적한다.

토기 소성기술과 토기가마 보강분은 `Find`에 `potteryFiringTraceObservation`, `potteryKilnFurnitureContext`를 배치하고, `Feature`에 `potteryKilnIdentification`, `potteryKilnStructureContext`, `potteryKilnPartInvestigation`, `potteryKilnYardFacility`, `potteryKilnInterpretationRisk`를 배치했다. 토기 표면흔은 부정형·원반형·고리형·점열형·사각형·일자형, 위치, 개수, 간격, 함몰, 연소흔·자연유·흑색 윤과의 구분을 유물 카드에서 남긴다. 요도구 관계는 이상재·이기재 기능 후보, 초본류·모래·할석·내화토·점토덩어리·토기편·전용토제품, 중첩소성 조합과 도치 여부를 표면흔과 연결한다. 토기가마는 소성유구/구조요 판정, 요상 경사 단독판정 금지, 화구·연소부·소성부·연도부·회구부의 부위별 조사, 토취장·태토저장·건조장·공인 생활공간 같은 요장 시설, 최종조업품 자동판정과 회구부 자동연결 금지를 분리해 기록한다. `Sample`에는 `potteryKilnAnalysisPlan`을 두어 숯 AMS·C14, 수종분석, 토기 OSL, 태토 성분분석, 소결 요상·요체 고고지자기 시료를 조사 완료 전 점검하게 했다.

기와가마·와요 보강분은 `Feature`에 `tileKilnStructureContext`, `tileKilnExcavationControl`, `tileKilnPartInvestigation`, `tileKilnOperationSequence`를 배치했다. 요체만 기록하지 않고 요전부, 아궁이, 연소실, 소성실, 연도부, 회구부, 폐기장, 채토공, 제작공방, 건조장, 보관소, 배수시설을 생산공간으로 함께 묶는다. 제토량, 적토장소, 10m 격자 조정, 장축둑과 가마-회구부 연결둑, 구지표·천정 상부·소결 윤곽 보존은 조사 제어 항목으로 분리했다. 부위별 조사에서는 연소실·소성실 분리 근거, 연도 미확인 주의, 회구부 관계 검증, 재층 일부 보존, 층위별 수습을 남긴다. `Find`에는 `tileKilnFindContext`를 두어 생산품, 불량품, 잔여품, 축조재·요도구·보수재, 폐기 후 유입품, 층위별 문양 기록을 구분하고, `Sample`에는 `tileKilnAnalysisPlan`을 두어 C14 위치별 시료, 고고지자기 다지점 시료, OSL 차광, 기와·가마 태토와 소비지 기와 대조를 한 흐름으로 관리한다.

자기요장 보강분은 `Feature`에 `porcelainKilnSiteSystem`, `porcelainWorkshopProcess`, `porcelainKilnStructure`, `porcelainKilnExcavationControl`을 배치했다. 토취장, 원토보관처, 수비공, 태토건조장, 연토장, 성형장, 시유시설, 가마, 폐기장, 생활공간, 수원, 연료원, 운송로, 소비지 비교를 요장 단위 생산체계로 묶고, 공방 공정은 수비·건조·연토·물레성형·굽깎기·시문·유약제조·유약저장·시유 순서로 남긴다. 가마 구조는 요전부, 봉통부, 불턱, 번조실, 노리칸, 불창기둥, 격벽, 창불구멍·마개, 초벌칸, 배연로, 개자리, 연통부를 분리하고, 조사 제어 항목은 등고선 트렌치와 지구물리탐사 병행, 하단 사면 봉통부 탐색, 칸별 사진, 바닥 요도구 위치, 실제 수량 단독추정 금지를 확인한다. `Find`에는 `porcelainFindObservation`, `porcelainKilnFurnitureContext`를 두어 재질·색, 태토, 유색, 시유, 시문, 기형, 기종, 굽, 내저원각, 갑발, 도지미, 굽받침, 모래받침, 포개구이 근거를 기록하고, `Sample`의 `porcelainAnalysisPlan`은 원토·태토·자편·유약·백토·가마벽체·수종·연대·소비지 자편 비교를 한 흐름으로 관리한다.

고고지자기 보강분은 `Sample`에 `archaeomagneticSampleContext`, `archaeomagneticSamplingWorkflow`, `archaeomagneticOrientationRecord`, `archaeomagneticResultQuality`, `archaeomagneticChronologyInterpretation`을 배치했다. 소토 유구 유형과 최종소성면 후보, 파괴 채취 협의, 정방위 큐브·석고 고정·시료번호·주향 표시, pitch·dip·strike와 자북/진북·편각 보정, NRM·교류소자·D/I/L95/K·n/N·D.F.·제외 시료, 한국·일본 표준곡선과 지역차·C14/OSL/층위/형식 편년 대조를 같은 시료 흐름에서 확인하게 했다. 결과값은 “고고지자기 추정연대”로 다루고 단독 확정연대로 쓰지 않는다는 주의도 값 목록에 포함했다.

측구부탄요 보강분은 `Feature`에 `charcoalKilnIdentification`, `charcoalKilnStructurePart`, `charcoalKilnExcavationControl`, `charcoalKilnTraceInterpretation`을, `Sample`에 `charcoalKilnAnalysisPlan`을 배치했다. 낮은 피열흔 때문에 성격불명 소토유구로 흘러가는 것을 막기 위해 측구식·무측구식, 백탄·흑탄·겸용 후보, 지하식·반지하식·반지상식·지상식, 소성부·연소부·분구·연도·연통·측구·측구폐쇄석·측면작업장·외부배수구, 장축·단축 토층둑, 중앙 트렌치 보류, 폐쇄석 원위치, 피열색·천정부 초류흔·굴지구흔, 목탄·주혈 탄화목·수종분석·C14·고고지자기·OSL 시료를 한 흐름으로 점검하게 했다.

이 구현 단위가 먼저 들어가야 각 유적 유형별 템플릿을 만들 때 기록이 흩어지지 않는다.

## 검증 질문

샘플 프로젝트는 다음 질문을 통과해야 한다.

1. 하루 작업기록에서 보고서 도면·사진·목록까지 원기록 ID가 이어지는가.
2. 현장 종료 전에만 확인 가능한 값이 비어 있으면 경고되는가.
3. 지표·표본·시굴에서 정밀발굴로 넘어갈 때 자료 인계가 추적되는가.
4. 시료가 분석명만이 아니라 분석 질문과 채취 맥락을 갖는가.
5. 표준 용어와 현장 관용어를 모두 검색하되 저장값은 권위어로 정규화되는가.
6. 판단 보류가 확정값으로 덮이지 않고 검토 이력으로 남는가.
