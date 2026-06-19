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
| 작업 역할·책임 | 현장에서는 한 조사자가 측량, 사진, 안전, 민원, 자료정리, 보고서 준비를 겸할 수 있으므로 역할 공백과 책임 범위가 일지 문장 속에 묻히면 안 된다. | `Operation`과 `DailyLog`의 `operationRoleResponsibility`가 조사단장, 책임조사원, 현장팀장, 측량·사진·도면·안전·민원·유물정리·시료·일지·보고서 담당, 검토자와 역할 공백을 추적한다. |
| 현장 보호·보안 운영 | 허가조건과 보존조치 결정이 있어도, 현장에서는 허가서 비치, 보안 유지, 주민·관할기관 통보, 유적보호 주의사항, 기상 대비, 야간방범, 임시유물·기록물 보관이 매일 실행되어야 한다. | `Operation`의 `siteProtectionSecurity`가 착수·진행·철수 전 보호·보안 실행 여부를 일지와 함께 추적한다. |
| 현장시에만 가능한 값 경고 | 층 경계, 수습 전 상태, 사진 각도, 표본 위치처럼 나중에 되돌릴 수 없는 값이 있다. | `RecordCreationTiming`으로 기록 시점을 구분하고, `fieldOnlyMissingCheck`와 `firstExposureRecord`를 필수값으로 두어 기존 `missingMandatoryFields` 경고가 빈 기록을 잡게 한다. |
| 발굴맥락과 조사방법 | 발굴은 유적·유구·유물·유물복합체·환경을 수평·수직 맥락으로 묶고, 트렌치·피트·바둑판식·사분법·계단식 같은 조사방법 선택근거를 남겨야 한다. | `Feature`의 `excavationContextModel`이 유적·유구·유물·유물복합체·환경 연결과 조사방법 선택근거, 기획·구제발굴 구분을 기록한다. |
| 발굴행위 역순 검토 | 표토, 교란, 상부퇴적토, 유구 매몰토 제거와 축조·사용·폐기면 확인은 행위의 역순 원칙을 따라야 하며, 예외가 있으면 사유를 남겨야 한다. | `Feature`의 `excavationReverseSequenceCheck`가 표토·현대교란·도굴갱·상부퇴적토·매몰토 제거와 축조면·사용면·폐기면 확인을 점검한다. |
| 제토·둑·안전 운영 | 구획·둑 설정, 배수, 장비 제토, 기준단면 촬영과 보호, 안전거리, 철수 전 기록 점검은 유구 유형보다 먼저 작업 단위에서 관리되어야 한다. | `Operation`의 `excavationControlSafety`가 둑 폭·보호, 배수로·집수정, 장비 제토 두께, 사진 방향·스케일, 기준단면 당일 기록, 안전휀스, 철수 전 점검을 추적한다. |
| 보고서 역산 | 보고서 초록, 도면 목록, 사진대장, 유물·시료 목록은 나중에 따로 만드는 문서가 아니라 현장기록에서 생성되어야 한다. | `ReportPreparationReview`와 `ReportEditorialCrossCheck`가 원고, 도면, 사진, 일지, 목록, 번호 변환표의 불일치를 원기록 ID와 연결한다. |
| 보고서 평가 환류 | 보고서 평가표는 반복 오류와 보완 요구를 잡아내는 장치지만, 현장 품질을 완전히 대신하지는 못한다. | `ReportEvaluationApplicabilityReview`와 `ReportFieldQualityFeedback`이 자체평가·위원회평가 차이, 비해당 항목, 적용 제외 근거, 원기록 보완 작업을 연결한다. |
| 공개·권리·민감정보 관리 | 공개자료는 사진이나 3D 파일을 그대로 내보내는 일이 아니라 위치정보, 인골, DNA, 도굴 위험, 미확정 해석, 사용권, 설명문을 함께 검토하는 업무다. | `publicArchaeologyOutput`, `publicEngagementProgram`, `accessControlTag`, `mediaRights`가 공개 형식, 운영기록, 공개등급, 권리·라이선스·민감정보 가림을 `Project`, `Operation`, `Photo`, `Drawing`에서 추적한다. |
| 실험·연구 역할 분담 | 실험고고학은 복원품 제작이 아니라 질문, 가설, 변수, 대조군, 반복, 실패값, 외부검토가 있는 검증 절차이며, 발굴·분석·보존·공개 책임은 기관 사이에서 끊기기 쉽다. | `experimentDesign`, `researchRoleAssignment`, `researchProcessBalance`가 실험 설계와 자료 수집·분류·분석·해석·보고·공개·보존 단계의 담당과 공백을 한 작업기록에서 관리한다. |
| 한국고고학 제도 리스크 | 국내 구제발굴은 개발 절차, 일정 압박, 경쟁입찰, 전문성 약화, 과학분석 배제, 보고서 품질 위험이 조사 결과를 흔들 수 있다. | `koreanArchaeologyInstitutionalRisk`가 Project 단위에서 조사 품질에 영향을 주는 제도적 조건을 구조화하고, `researchRoleAssignment`, `researchProcessBalance`, `reportEvaluationFeedback`과 함께 검토하게 한다. |
| 해외조사 문화재 리스크 | 해외 개발사업도 현지 법제, 조사허가, 반출 제한, 보존·전시, 국제 공개, 안전·분쟁, 일정 지연 위험을 사업 시작 전에 관리해야 한다. | `overseasHeritageRisk`가 현지 법·허가·협력기관·보존계획·공개소통·구제발굴 역량을 프로젝트 단계의 리스크 값으로 남긴다. |
| 조사단계 전환과 인계 | 지표·표본·시굴·정밀발굴은 단절된 프로젝트가 아니라 판단과 자료가 이어지는 단계다. | `InvestigationStageTransition`과 `InvestigationRecordHandover`에 앞 단계 기록, 출토유물, 약식보고서, 후속기관, 최종보고서 연결을 둔다. |
| 행정·보존 이행 | 보존조치는 결정으로 끝나지 않고 이행, 통보, 관리주체, 점검, 재평가로 이어진다. | `PreservationDecisionPackage`, `PermitConditionComplianceRecord`, `ReportSubmissionWorkflow`, `StateVestingSelectionRecord`를 조사사업 카드에 연결한다. |
| 의뢰·계획·변경 관리 | 조사기관은 학술 조사뿐 아니라 사업시행자 자료 접수, 선행자료 확인, 현장답사, 전문기관 배정, 민원·일정 조율까지 담당한다. | `InvestigationRequestIntake`와 `InvestigationPlanChangeRecord`가 접수 경로, 기초자료, 계획 전 답사, 담당자, 조사기간·예산·조사단 변경, 허가·계약 변경 근거를 저장한다. |
| 전문가 검토회의와 부분완료 | 중요 유구·유물, 보존 방안, 부분완료 공사 시행 여부는 원도면·사진·유물현황·조사기관 의견에 근거해 판단된다. | `ExpertReviewMeeting`과 `PartialCompletionPackage`가 회의 사유, 참석자 자격, 제출자료, 상이 의견, 부분완료 구역·트렌치·사진·잔여구간·통보 결과를 원기록 ID에 연결한다. |
| 지표조사 결과 처리 | 지표조사는 보고서 제출로 끝나지 않고 후속조사 범위, 보존방안, 수습 유물 귀속, 기존 유적 범위 수정과 디지털 등록으로 이어진다. | `SurfaceSurveyResultProcessing`이 사업 이격거리, 향후 대책, 입회·확인·시굴·발굴, 유물목록·대장·보관증, 전산화 등록, 기존 유적 범위 수정을 추적한다. |
| 질문형 유구 야장 | 유구명만 고르는 방식은 수혈주거지, 고분, 성곽, 생산유구의 조사 과정을 설명하지 못한다. | 유구 유형별 카드에는 단계별 질문, 확인 전제, 대안 해석, 사진·도면·시료 연결을 둔다. 1차 구현은 `Feature`의 수혈건물지 노출·둑, 바닥·시설, 화재 증거, 중복 선후관계 체크리스트로 시작한다. |
| 층위와 유구 형성과정 | 토색이나 층명만으로 층을 확정하면 산화·환원, 교란, 후퇴적 변형을 오인할 수 있다. | `FeatureSegment`의 `stratigraphicDivisionBasis`, `soilParticleFieldCheck`, `layerBoundarySurfaceRecord`, `stratigraphicMisreadGuard`, `featureFillInterpretation`, `naturalHumusRelativity`로 층 구분 근거, 경계면, 오인 후보, 내부토 해석, 생토·부식토 상대성 판단을 분리한다. |
| 매체의 기록 단위화 | 사진, 도면, 3D, GPS, GIS는 첨부파일이 아니라 판단 근거다. | 매체마다 목적, 대상, 방향, 기준점, 좌표계, 품질, 후처리, 재촬영·재실측 필요 여부를 가진다. |
| 원문 근거 색인 | 도표·사진·표·캡션·사례명·한자·수치가 OCR 노트나 보고서 삽화로 흩어지면 필드 설계 근거와 재대조 상태가 사라진다. | `SourceEvidenceIndex`가 원문 자료 종류, 적용 영역, 대조 상태, 사용 목적을 `Project` 아래에서 추적한다. |
| 분석 목적 기반 시료 | 자연과학 시료는 분석명보다 어떤 질문을 검토하는지가 먼저다. | `PaleoenvironmentSample`, `PitDwellingScienceSamplingPlan`, `ArchaeobotanySamplingPlan` 등에서 채취 시점, 위치 도면, 대표성, 오염·빛·수분 통제, 분석 질문을 필수 후보로 둔다. |
| 유물·시료 생애주기 | 수습 뒤 목록 작성으로 끝나지 않고 응급처치, 포장, 임시보관, 보존처리, 국가귀속, 이관이 이어진다. | `ArtifactHandlingWorkflow`와 `ArtifactCustodyAndStorageWorkflow`가 수습 전 상태부터 이송·수장 환경까지 추적한다. |
| 유물 수량과 수장 기준 | 국가귀속·이관용 수량은 파편 수가 아니라 행정 건수, 물리 점수, 동일개체·부속구 판단, 실수량 병기가 결합된 값이다. | `ArtifactQuantityBasis`가 `건/점/실수량/구성품/근거사진`을 분리하고, `StorageEnvironmentProfile`이 재질별 온습도·조도·오염물 기준과 실측값을 저장한다. |
| 용어 권위와 검색 분리 | 전문사전 표제어, 기관 관용어, 한자·원어 색인은 모두 필요하지만 저장값으로 바로 합치면 안 된다. | `TermAuthority`, `TermAlias`, `TermRelationship`을 두고 검색어·보고서출력어·우선표제어·검증상태를 분리한다. |
| 일반 용어와 전문 용어 매핑 | 현장에서는 집자리, 고인돌, 조개더미, 돌방무덤처럼 익숙한 말을 쓰지만 보고서와 전문사전은 주거지, 지석묘, 패총, 석실묘처럼 다른 표제어를 쓰기도 한다. | `TermImportMapping`이 입력어, 권위표제어, 보고서출력어, 구조 하위유형, 추정상태, 검증상태를 연결한다. |
| 유적 유형별 패키지 | 하나의 거대 양식은 현장에서 느리고, 단순 공통 양식은 전문 관찰값을 빠뜨린다. | 공통 핵심 카드 위에 구석기·패총·건물지·고분·생산유적·성곽·충적지·제철유적 패키지를 붙인다. |
| 성곽 부속시설 세분 | 성문·암문·수문·수구·여장·해자는 이름만 남기면 방어와 배수 기능, 폐쇄장치, 수리 이력이 사라진다. | `FortificationGateFacility`와 `FortificationWaterFacility`가 오성지·누조·누혈·장군목·장군석, 수문·수구·은구, 왜성 해자의 물 유무·배치 방향·기능을 부재 단위로 저장한다. |
| 성곽 축조·정비·복원 근거 | 판축·성토·보수·복원은 결과명만 남기면 협판·고정주·달구질흔, 기초다짐, 원부재, 용척 산정, 설계변경, 복원 제외 사유가 사라진다. | `fortificationConstructionEvidence`, `fortificationFoundationRecord`, `fortificationRepairRecord`, `fortificationRestorationEvidence`가 축조기법 근거, 성벽 기저부, 보수공사 기록, 복원·중건 증거를 `Feature`에서 따로 추적한다. |
| 생산유적 세부 패키지 | 기와가마·토기가마·자기가마·제철유적은 요체 하나가 아니라 원료, 작업장, 부위별 조사, 폐기장, 분석시료, 소비지 비교가 맞물린 생산 체계다. | `KilnYardSystem`, `TileKilnInvestigation`, `ProductionSampleReliability`, `ProductionConsumptionLink`처럼 생산공간, 부위별 수습, 연대·태토분석 신뢰도, 생산지-소비지 대조를 분리한다. |
| 생산유적 용어 정규화 | `가마/요/요지`, `노/로`, `철재/슬래그`를 같은 단어로 합치면 현장 원문과 공정 판단 근거가 사라진다. | `ProductionTermNormalization`, `IronProcessClassification`, `IronResidueSubtype`이 입력어, 우선표제어, 생산분야, 공정후보, 분석후확정을 분리한다. |
| 형식·편년·해석 논증 | 형식명과 시대값은 관찰값이 아니라 속성, 층위, 공반, 기존 편년안, 대안 검토가 결합된 해석이다. | `typologyArgument`, `chronologyArgument`, `assemblageRelation`, `interpretationArgument`로 대표 속성, 변이, 공반 관계, 전승품·재사용 위험, 대안 편년, 관찰·해석 분리, 채택 근거를 남긴다. |
| 위험값과 판단 보류 | 후보석기 폐기, 구석기 가능층 누락, 후대 혼입, 대형자료 선별, 색조 오인 같은 위험은 조사 결과를 바꾼다. | `Risk/Uncertainty` 필드를 공통화하고 검토 완료 전에는 기록을 닫지 않게 한다. |

## 첫 구현 단위

1. `KoreanFieldwork-*` 공통 값 목록: 기록 생성 시점, 검증상태, 현장기록 품질, 작업 역할·책임, 현장 보호·보안, 제토·둑·안전 관리, 현장시점 누락점검, 최초 노출 기록, 수혈건물지 노출·둑, 수혈건물지 바닥·시설, 화재 수혈건물지 증거, 중복 수혈건물지 선후, 제철 공정 근거, 제철 노 구조, 제철 부산물 세분, 제철 시료 분석계획, 일일 작업기록, 일지 증거 역할, 일지 검토, 개인 야장 공적기록화, 디지털 원자료 보존, 조사 행정 흐름, 허가조건 이행, 보존조치 이행, 조사자료 인계, 용어관계, 용어 검색·매핑, 용어 검증상태, 사전 분야, 용어 적용범위, 출처 우선순위, 지표조사 현장관찰, 지표조사 편향방지, 지표조사 후속조치, 표본조사 적합성, 시굴조사 목적, 시굴 트렌치 설계, 정밀발굴 범위·난이도 근거, GIS·항공사진 예측근거, 예측 현장검증, 유물 관리 절차, 유물 건·점수 산정, 수장환경 관리, 유적 패키지, 형식 논증, 편년 논증, 공반 관계, 해석 논증, 발굴맥락 구성, 발굴행위 역순 검토, 생토·부식토 상대성, 시료 목적, 시료 채취·보관, 식물고고학 시료 설계, 식물유체 표본추출, 플로테이션 처리기록, 식물유체 동정기록, 식물고고학 해석검토, 식물유체 미검출 평가, 매체 증거 역할, 매체 품질검수, 보고서 교차검토, 보고서 평가 환류, 공개자료, 공개·교육 프로그램, 공개등급·민감정보, 매체 권리관리, 해외조사 문화재 리스크, 한국고고학 제도 리스크, 연구 역할 분담, 연구과정 연결상태, 실험고고학 설계, 성곽 축조기법 근거, 성벽 기초·기저부 기록, 성곽 보수·정비 기록, 성곽 복원·중건 근거
   - 동물유체 구현 값 목록: 동물유체 수습·표본, 동물유체 보존·취급, 동물유체 동정기록, 뼈 표면 변형관찰, 동물유체 계량지표
   - 생산유적·유물수습 보강 값 목록: 생산유적 공정 체계, 생산유적 주변시설, 유물 수습·보존 위험, 세척·건조 관리
   - 원문 근거 색인 값 목록: 원문 자료 종류, 원문 근거 적용 영역, 원문 대조 상태, 근거 사용 목적
2. 독립 `FieldRecordQualityReview`, `DailyLog`, `TermAuthority`, `TermAlias`, `SourceEvidenceIndex` 1차 카드
3. `InvestigationProject` 행정 타임라인
4. `fieldOnlyMissingCheck`와 `firstExposureRecord` 필수값 경고
5. `ReportPreparationReview`와 도면·사진·목록 교차검토
6. `InvestigationStageTransition`과 후속기관 인계
7. `TermAuthority` 기반 한국어 용어 검색과 자동완성
8. `typologyArgument`, `chronologyArgument`, `assemblageRelation`, `interpretationArgument` 기반 형식·편년·해석 판단근거

`SourceEvidenceIndex`는 `Project` 하위 카드로 두어 제5·6·7·9권과 사전류의 도표, 사진, 표, 캡션, 사례명, 한자, 수치, 출전, 점검표, 분석결과표를 원문 자료 종류, 근거 적용 영역, 원문 대조 상태, 사용 목적과 함께 관리한다. 이 카드는 원문 내용을 저장소에 옮기는 장치가 아니라, OCR 노트에서 뽑은 후보가 성곽·충적지·고분·생산유적·용어 권위 같은 실제 입력 설계로 넘어가기 전에 원PDF 대조 필요 여부와 적용 범위를 남기는 장치다.

`Config-KoreanFieldwork`는 1차 공통 값 목록을 Project, Operation, Survey, FeatureGroup, Feature, FeatureSegment, Find, Sample, Drawing, Photo 화면에 배치한다. 현장기록 품질은 각 기록 단위에, 현장시점 누락점검은 `Feature`, `FeatureSegment`, `Find`, `Sample`에, 최초 노출 기록은 `Feature`와 `FeatureSegment`에 배치했다. `fieldOnlyMissingCheck`와 `firstExposureRecord`는 해당 화면의 필수값으로 지정해 값이 없으면 기존 필수값 경고 흐름에 잡히게 했다. `operationRoleResponsibility`는 `Operation`과 `DailyLog`에 배치해 조사단장, 책임조사원, 현장팀장, 측량·사진·도면·안전·민원·유물정리·시료·일지·보고서 담당과 검토자, 역할 공백을 일지 흐름에서 구조화하게 했다. `siteProtectionSecurity`는 `Operation`에 배치해 허가서 현장 비치, 착수신고 안내, 보안 유지, 주민·관할기관 통보, 유적보호 주의사항, 기상 대비, 야간방범, 임시유물·기록물 보관, 철수 전 미작성자료 조치를 행정 상태가 아니라 당일 실행값으로 남기게 했다. `excavationControlSafety`는 `Operation`에 배치해 구획·둑 계획, 둑 보호, 배수·집수정, 하강조사, 장비 제토 두께, 삽날 관찰, 작업 안전거리, 기준단면 당일 사진·도면, 안전휀스, 철수 전 기록물 점검을 일지와 함께 관리하게 했다. 수혈건물지·수혈주거지 강의자료에서 반복되는 어깨선, 둑 설정, 단면 보양, 바닥면·내부시설, 화재 증거, 중복 선후관계는 `pitDwellingExposureBaulk`, `pitDwellingFloorFacility`, `pitDwellingFireEvidence`, `pitDwellingOverlapSequence`로 `Feature`에 배치해 유형명 확정보다 조사 과정의 증거를 먼저 남기게 했다. 제철유적은 `ironProcessEvidence`와 `ironFurnaceStructure`를 `Feature`에, `ironResidueSubtype`을 `Find`에, `ironSampleAnalysisPlan`을 `Sample`에 배치해 노 형태, 송풍·배재 구조, 부산물 세분, 금속학 분석계획을 공정 확정 전에 따로 남기게 했다. 고분은 `tombMoundInvestigation`과 `tombBurialStructureInvestigation`을 `Feature`에 배치해 봉토·분구의 구지표, 성토 단위, 조사둑, 주구, 보존구역과 매장주체부의 묘광, 관·곽·실, 개석, 밀봉토, 폐쇄시설, 추가장·도굴 근거를 나누어 기록하게 했다. 부장품과 제사자료는 `graveGoodsRitualContext`로 `Find`에 배치해 착장, 관 내부·외부, 봉토·주구, 입구·폐쇄부, 의도적 파손, 동물·음식 공헌, 외래요소 후보, 인골과의 위치관계를 유물 카드에서 바로 남기게 했다. 인골은 `humanRemainsRecoveryAnalysis`로 `Sample`에 배치해 전문가 협의, 보존처리 전 DNA, 핀폴 보링 금지, 약한 도구, 차양, 물 사용 제한, 1/5 도면, 포장·주기, 장기건조, 개체식별과 분석 기준을 이어서 기록하게 했다. 일일 작업기록과 일지 검토는 `diaryAbstract`가 있는 `Operation`에 먼저 배치하고, 독립 `DailyLog`는 `Operation` 하위 카드로 두어 당일 사실기록, 누적 조사원·인부·장비 수, 날씨·우천작업, 위원회·전문가 검토회의, 발주처·기관 소통, 분쟁 증거 가능성을 별도 기록하게 했다. 개인 야장 공적기록화는 `Operation`에, 디지털 원자료 보존은 `Project`와 `Operation`에 우선 배치했다. 독립 `FieldRecordQualityReview`는 `Operation` 하위 카드로 두어 검수 대상 기록, 검수 단계, 수정·보완 근거를 별도 기록하게 했다. 독립 `TermAuthority`는 `FeatureGroup` 하위 카드로 두어 사전 분야, 적용범위, 출처 우선순위, 용어 관계, 검색 매핑, 검증상태를 한 곳에서 관리하게 했다. 독립 `TermAlias`는 `TermAuthority` 하위 카드로 두어 현장 동의어, 찾아가기, 기관 관용어, 보고서·사업명, 한자·원어 변형, OCR 변형을 우선표제어와 분리하고, 자동완성 허용·검색어 보존·가져오기 전용·원PDF 대조 필요 같은 처리 방식을 별도 기록하게 했다. 조사 행정 흐름, 허가조건 이행, 보존조치 이행은 `Project`에, 조사자료 인계는 `Project`와 `Operation`에 배치해 표본·시굴·정밀발굴 사이의 기록 이동을 끊기지 않게 했다. 보고서 교차검토와 보고서 평가 환류는 `Project`와 `Operation`에 함께 배치해 원고·도면·사진·목록 대조와 자체평가·위원회평가 차이, 비해당 항목, 보완요구 추적이 조사 단위와 사업 단위에서 모두 남도록 했다. `koreanArchaeologyInstitutionalRisk`는 `Project`에 배치해 국내 구제발굴의 일정 압박, 경쟁입찰, 전문성 약화, 과학분석 배제, 보고서 품질 위험, 기관 역할 불명확이 조사 품질에 미치는 영향을 역할분담·연구과정·보고서 환류와 함께 보게 했다. `Survey`에는 지표조사를 유적 확정 절차가 아니라 현장관찰, 편향방지, 후속조치 판단근거로 관리하는 세 목록과 표본조사 적합성, 시굴조사 목적, 시굴 트렌치 설계, 정밀발굴 범위·난이도 근거, GIS·항공사진 예측근거, 예측 현장검증 목록을 배치했다. `FeatureGroup`, `Feature`, `FeatureSegment`, `Find`에는 용어 관계, 용어 검색·매핑, 사전 근거, OCR 교정 필요, 원PDF 대조 완료, 값목록 후보, UI 노출 보류를 표시하는 용어 검증상태를 배치했다. `Find`에는 `artifactHandlingWorkflow`, `artifactLabelRegisterLink`, `artifactQuantityBasis`, `storageEnvironmentControl`을 배치해 현장수습, 꼬리표·유물대장·정리번호 연결, 응급처치, 건·점수 산정, 동일개체·부속구 판단, 재질별 수장환경을 유물 카드에서 바로 추적하게 했다. `Feature`와 `Find`에는 형식 논증, 편년 논증, 공반 관계, 해석 논증을 함께 배치하고, `FeatureSegment`에는 최소한 편년 논증을 배치해 시대·형식값이 근거 없이 확정되지 않게 했다. Sample 화면에는 시료 목적, 빛·수분·오염·위치도면 연결 조건, 제철 시료 분석계획, 식물유체 표본설계·처리·동정·해석·미검출 평가를 배치했다. Drawing과 Photo 화면에는 `mediaEvidenceRole`, `mediaQualityCheck`, `digitalSourcePreservation`, `reportCrossCheck`를 배치해 방향·축척·기준점·원본 보존·대장번호 대조·보고서 도판 후보 여부를 매체 자체에서 점검하게 했다. 성곽 보강분 중 성문·방어 부속시설, 암문 기능, 여장 세부, 수문·수구, 왜성 해자는 `Feature` 화면의 첫 전문 값 목록으로 옮겼다.

해석 논증 보강분은 `Feature`와 `Find`의 `interpretationArgument`에 먼저 배치했다. 연구질문 연결, 관찰·해석 분리, 분류근거, 대안해석, 자연·후퇴적 과정, 유추 한계, 실험·민족지 근거, 분석결과 영향, 보고서 채택 근거를 같은 목록으로 두어 형식명이나 시대값이 해석의 끝처럼 저장되지 않게 한다.

발굴맥락 구성 보강분은 `Feature`에 `excavationContextModel`을 추가했다. 이 값은 유적·유구·유물·유물복합체·환경 연결, 수평분포와 수직층위 검토, 조사방법 선택근거, 트렌치·피트·바둑판식·사분법·계단식 조사, 기획발굴과 구제발굴 구분을 한 목록으로 묶어 유구명이 맥락 기록을 대신하지 않게 한다.

발굴행위 역순 검토 보강분은 `Feature`에 `excavationReverseSequenceCheck`를 추가했다. 표토, 현대교란선, 도굴갱, 상부퇴적토, 유구 매몰토 제거와 축조면·사용면·폐기면 확인을 분리해 기록하고, 행위의 역순 원칙에서 벗어난 경우에는 예외 사유를 남기게 한다.

제7권 성곽 축조·보존관리 보강분은 `Feature`에 `fortificationConstructionEvidence`, `fortificationFoundationRecord`, `fortificationRepairRecord`, `fortificationRestorationEvidence`를 추가했다. 축조기법은 판축명 확정 전에 협판, 고정주, 횡장목, 달구질흔, 판괴연접, 역경사판축, 부엽공법, 부석·석축 보강과 유사판축 주의를 기록한다. 기초·기저부는 구지표, 정지면, 기초다짐층, 기조·배수·절토 후보, 지정, 지대석 받침, 줄구덩이 조사와 전면 제토 회피를 성벽 본체 해석보다 앞에 둔다. 보수·정비는 현황도면, 현황사진, 조사 전·중·후 사진, 정밀실측·3D스캔, 붕괴 성돌·적심석 관리, 해체 단면, 배수체계, 설계변경, 자문, 준공검사를 수리보고서와 연결한다. 복원·중건은 문헌, 고지도, 옛 사진, 발굴 유구, 주초·적심 배열, 주간거리와 용척 후보, 원부재 조사·반환·재사용, 신규 재료 대체 사유, 복원 제외, 현장보존, 현대 재료 구별과 경관 영향을 한 근거 묶음으로 남기게 했다.

행정·검토회의 OCR 보강분은 `Project`에 `investigationRequestIntake`, `investigationPlanChangeRecord`, `expertReviewMeeting`, `partialCompletionPackage`, `recordTransferManagementSystem`을 배치하고, `Operation`에 현장 단위 `expertReviewMeeting`, `partialCompletionPackage`, `recordTransferManagementSystem`을 배치했다. `Survey`에는 `surfaceSurveyResultProcessing`을 추가해 지표조사 결과가 후속조사 범위, 보존방안, 유물목록·대장·보관증, 전산화 등록, 기존 유적 범위 수정으로 이어지는 흐름을 남기게 했다.

고분 조사법 추가 대조분은 `Feature`에 `tombSurveyPurpose`, `moundTrenchInvestigation`, `moundFillSubdivisionRecord`, `stoneCistWallPackingRecord`, `tombInteriorRecoveryRecord`를 더했다. 조사 목적은 성격 구명, 정비·복원, 구제조사, 존부·외연 확인, 기간·예산 제약과 훼손 최소화를 먼저 남기고, 봉분 트렌치는 매장주체 장축·단축, 능선과 경사 방향, 외측 연장, 토층둑 위치, 평면 제토 병행, 단면·평면 대조와 부분정보 주의를 기록한다. 봉분 성토는 현장에서 세분해 성토재 물성, 구성비, 운반 단위, 구획성토, 성토공정과 범위를 보존하고, 석곽·석실은 개석 가공도, 석재 암질, 벽체 상면 점질토, 목재 받침, 충전공간, 피복토와 미장토를 따로 남긴다. 분묘 내부 수습은 내부 조도, 교란토 체질, 바닥 근처 정밀조사, 소형유물 유실, 유기물 변색·건조 방지, 고유번호와 연구실 분리해체 계획을 묶어 현장 노출 중 사라지는 정보를 붙잡는다.

횡구식·횡혈식 석실분 보강분은 `Feature`에 `stoneChamberTombTypology`, `tombPassageClosureSequence`, `burialPlatformUseSequence`, `tombRitualDepositRecord`를 추가했다. 석실 묘형은 수혈식석곽, 횡구식석곽, 횡구식석실, 횡혈식석실 같은 이름을 먼저 확정하지 않고 입구부, 흙 묘도, 석축 연도, 현실, 관대·시상, 추가장 근거와 묘제·장제 불일치 가능성을 함께 남긴다. 묘도와 연도는 축선, 충전부 윤곽, 중앙둑, 바닥, 폐쇄석·폐쇄토, 문지방·문비석, 배수, 재개방·수리 흔적을 매장 순서와 대조한다. 관대와 시상은 두침·족좌, 표면 마감, 중첩·접속, 복수 피장자, 추가장 예정 공간, 시상별 부장품 위치, 제거 역순과 해체 후 단면으로 기록한다. 제사·매납은 봉토 정상부·사면·기저부, 주구, 묘도, 연도, 폐쇄 전후, 현실 내부, 제사용 토기군, 의도적 파손, 동물·음식 공헌, 위치·레벨, 축조공정 연결과 재퇴적 주의를 함께 저장한다.

층 구분·내부토 보강분은 `FeatureSegment`에 `stratigraphicDivisionBasis`, `layerNamingSystem`, `featureFillInterpretation`, `soilTextureFieldAssessment`를 추가했다. 색 차이만으로 층을 나누지 않고 입도, 혼합 상태, 층리면, 퇴적구조, 삭평·부정합, 수로 기능면, 토양화, 구지표와 문화층을 분리하며, 홍수퇴적처럼 하나의 사건층으로 유지해야 하는 경우도 기록한다. 층명은 대·중·세분층, a/b층, 문화층 번호, 유구 확인면 번호와 변경 이력을 남기고, 유구 내부토는 가공면, 기능면, 인위매립토, 붕락토, 자연유입토, 폐기 후 퇴적층과 귀속 주의를 따로 저장한다.

생토·부식토 상대성 보강분은 `FeatureSegment`에 `naturalHumusRelativity`를 추가했다. 생토, 문화층, 표토, 상부퇴적토, 유구 내 매몰토, 교란토는 절대 층명이 아니라 조사대상시대와 관계유구에 따라 달라지는 판단값이므로, 자연생토 후보·문화층 후보·구석기 문화층 후보·근현대 유구 소속층과 함께 조사대상시대 확인, 관계유구 확인, 판단 보류를 남기게 했다.

층 경계·오인 방지 보강분은 `FeatureSegment`에 `soilParticleFieldCheck`, `layerBoundarySurfaceRecord`, `stratigraphicMisreadGuard`를 추가했다. 입자는 자갈 직접 계측, 입자 크기표, 모래 체질, 수분 도말, 촉감, 표본시료, 실내 입도분석 대조를 구분하고, 경계면은 층리면·층계·구지표면·생활면·유구면·유구확인면·가공면·기능면과 명료도·형상을 따로 남긴다. 색조, 산화·환원, 지하수위, 구수로, 논둑, 산화철·망간, 뿌리·말목 변색, Bt-band는 별도층이나 유구로 바로 확정하지 않고 오인 후보로 관리한다.

유구 내부층 라이프사이클 보강분은 같은 `FeatureSegment`에 `stratigraphicObservationProcedure`, `featureLifecycleReview`, `featureBlockInclusionAssessment`, `featureBurialProcessAssessment`를 추가했다. 토층 단면 정리, 그늘·햇볕 조건, 반복 관찰, 층간 비교, 문화층 표시 같은 관찰 절차를 먼저 남기고, 그 뒤 내부층을 축조·사용·폐기·매몰 과정으로 검토한다. 이질토 블록은 인위매립으로 자동 판정하지 않고 기반층 유래, 타처 운반, 붕락층, 가공시 형성층, 유물 걸침 여부를 분리하며, 매몰 과정은 급격·점진 매몰, 자연유입, 수성퇴적, 라미나, 토양화 휴지기와 일괄유물 매몰을 따로 기록한다.

생활유적 조사절차 보강분은 `Feature`에 `pitFeatureFunctionAssessment`, `settlementFeatureInvestigationProcedure`, `settlementFeatureTrenchStrategy`를 추가했다. 수혈은 주거지로 바로 확정하지 않고 창고, 공방, 공공시설, 함정, 화장실, 폐기장, 태토 채취장, 노지·경화면·조리용기·저장공 근거를 함께 남긴다. 조사 절차는 사전조사, 평면조사, 중복관계, 트렌치와 둑, 하강, 내부 정리, 바닥조사, 절개와 검토 사진으로 나누고, 트렌치는 최소 훼손으로 바닥면·벽선·단면 연속성과 도면 역전 위험을 확인하는 전략값으로 관리한다.

생산유적과 유물 수습 보강분은 `Feature`와 `Find`에 나누어 배치했다. `productionProcessSystem`은 원료 채취·가공, 수비, 연토, 성형, 재임, 소성, 요출, 선별, 폐기와 보수 폐기물을 공정 순서로 남기고, `productionSiteAssociatedFacility`는 채토장, 점토 저장공, 녹로 축혈, 공방, 수비장, 건조장, 집수·배수시설, 주거지, 숯가마, 폐기장을 생산 체계와 연결한다. `artifactRecoveryPreservationRisk`와 `artifactCleaningDryingControl`은 소형유물·미세박편 유실, 내부토 물체질, 수분·자외선·염·산화·건조수축 위험, 보호장구·전문가 의뢰, 유구 단위 분리, 수습번호 유지, 세척 방식, 수침 보관, 그늘 건조와 급건조 방지를 `Find`에서 관리한다. 이미 구현된 `artifactHandlingWorkflow`, `artifactLabelRegisterLink`, `artifactQuantityBasis`, `storageEnvironmentControl`은 현장수습, 꼬리표·유물대장·정리번호 연결, 전체 정리·등록·수장 흐름을 담당하고, 가마 내부 유물 귀속 위험은 토기가마 맥락의 `potteryKilnInterpretationRisk`와 함께 본다.

보존과학 보강분은 `Find`에 `conservationScienceRequest`, `waterloggedWoodEmergencyStorage`, `lacquerConservationRisk`, `metalAnalysisRequest`, `ceramicConservationState`, `paperTextileEmergencyRecovery`, `conservationTreatmentPrincipleReview`를 배치하고, `Sample`에 `humanDnaFieldControl`, `organicSoilAnalysisSample`, `destructiveAnalysisDecision`을 배치했다. 출토 순간부터 분석 의뢰까지 보존과학이 유물 해석을 바꿀 수 있으므로 의뢰목적, 재질, 출토맥락, 비파괴 우선 여부, 파괴시료 승인, 잔여시료 보관, 수침목재의 차광·냉암소·표면약제 영향, 칠도막 갈라짐, 금속 분석 위치와 절단·연마 승인, 토도류 염결정·수화·물세척 주의, 지류·직물의 공기·빛·온습도 변화, 보존처리의 원형·증거·가역성 검토, 인골 DNA 접촉자·세척금지·분석실 인계, 내부토/대조토와 분석 질문을 같은 기록 흐름에서 남긴다.

유물실측 보강분은 `Drawing`에 `artifactDrawingRecordMethod`, `artifactDrawingPlan`, `artifactDrawingQualityCheck`, `potteryDrawingStandard`, `stoneToolDrawingView`, `waterloggedWoodDrawingHandling`을 배치했다. 실측을 유물 외곽선 복사가 아니라 기술·사진·탁본·실측·3D스캔·현미경사진이 결합된 기록으로 보고, 재질·기종·잔존상태·기능, 기준선·실측선·투상법·도면배치·축척·도구, 측점 검점·교정·사진/탁본 대조·보존처리 전후 대조·재실측 필요를 Drawing 카드에 남기게 했다. 토기는 정치상태, 단면 우선, 기벽두께 3-4점, 문양 측점을, 석기는 사용방향 정치와 제3각법 6면·전개도·타제/고타/마연흔을, 수침목재는 습식 제도와 보존처리 전후·분무수분·물상자·건조수축 위험을 따로 확인한다.

도면작성법 보강분은 `Drawing`에 `mapSourceMaterial`, `historicalMapLandscapeInterpretation`, `spatialDrawingProductionWorkflow`, `distributionMapRequirement`를 추가했다. 조선시대 지도, 일제강점기 지형도, 지적원도, 토지이용현황도, 항공사진, 정사영상, 수치지형도, DEM, 문화유적분포지도는 배경그림이 아니라 유구 잔존 상태와 과거 경관을 설명하는 근거이므로 제작연도·축척·좌표계·출처와 함께 기록한다. 주변유적분포도는 완성 PDF만 저장하지 않고 조사대상지역, 문화재·보호구역, 반경, 범례·축척·방위표, 내보내기 산출물까지 도면 카드에서 검수한다.

GPS·GIS 현장 시스템 보강분은 `Operation`에 `gpsSurveyQualityRecord`, `gpsNmeaRecord`, `fieldDatabaseOperationRisk`를, `Photo`에 `gpsPhotoLinkRecord`를 추가했다. 좌표값은 위도·경도만 저장하면 충분하지 않으므로 GPS/GNSS/RTK 방식, 기준국·이동국, 위성 상태, 관측시간, 원시데이터, 좌표계, 지오이드, 위성수, DOP와 정확도를 함께 기록한다. 사진은 파일명과 현재위치·궤적·등록지점·수치지도 연동 상태를 남기고, 현장 DB는 SHP/DXF 호환, 레이어·도형·속성 편집, 현장 동기화와 자료 갱신 위험을 운영기록으로 검수한다.

지표조사 준비·현장순서 보강분은 `Survey`에 `surfaceSurveyPreparationCheck`, `surfaceSurveyFieldSequence`, `surfaceSurveyMapRequirement`를 추가했다. 조사단 구성, 분야 전문가, 문헌·지도·기조사보고서, 문화유적분포지도, 현황측량도, GPS·사진기·나침반·기록지·유물봉투·탐침봉 같은 준비값을 먼저 점검하고, 현장에서는 경계 GPS, 전경 다방향 사진, 지형별 지구 구분, 기존 문화재, 유물산포, 노출 유구, 절개면 토층, 원지형 훼손, 탐문·설문을 순서대로 남긴다. 지표조사 지도는 점 하나가 아니라 다각형 조사범위, 유물산포지 곡선 범위, 사업계획도 대조, 축척·도엽번호, DGPS/RTK와 GPS 기준점으로 검증한다. 지표 수습 유물은 `Find`의 `surfaceFindHandlingRecord`에 개별 포장, 유물카드, 지도 표시, GPS 위경도, 지번, 근경·원경 사진, 눈금자·방위판, 부착토 보존과 세척주의를 남긴다.

지표조사 범위·전문성 보강분은 `Survey`에 `surfaceSurveyHeritageCategory`, `surfaceSurveyScopeDefinition`, `surfaceSurveyLowerChronologyReview`, `surfaceSurveyTeamExpertise`, `surfaceSurveyTimingReview`를 추가했다. 조사대상은 고고 유물산포지만이 아니라 건축사, 역사, 미술사, 인류민속, 자연유산, 수중문화재, 근대문화유산까지 확장될 수 있으므로 범주와 전문분야를 먼저 남긴다. 범위 산정은 사업구역 전체, 형질변경지, 연차·분할 사업 전체, 토취장·사토장·가설도로·수몰면·설계변경 부지와 주변 영향권을 따로 체크하고, 하한연대와 조사 시점은 보존 검토 시간을 확보했는지 판단하는 근거로 둔다.

지표 증거부재·자원조사 보강분은 `Survey`에 `surfaceEvidenceAbsenceAssessment`와 `nonSiteResourceSurvey`를 추가했다. 표면 유물이나 노출 유구가 없다는 사실은 유적 부재의 확정값이 아니므로 지형, 입지조건, 퇴적물 성격, 탐문, 경험 판단, 조사 한계와 추가조사 필요 여부를 분리한다. 비유적지라도 석재·점토 공급원, 성곽·고인돌 석재 공급지, 생산 원료 후보와 주변 자원분포는 유적 해석과 조사계획에 되돌아갈 수 있으므로 별도 조사값으로 둔다.

전자도면·3D 스캔 보강분은 `Drawing`에 `electronicDrawingSourceWorkflow`, `artifactElectronicDrawingProcedure`를 추가했다. 3D 스캔은 완성 도면을 대체하는 버튼이 아니라 스캐너 선정, 점군 획득·병합, 폴리곤 변환·최적화, CAD 데이터, 2D·3D 도면, 복원자료, 원본·후처리 파일 보존으로 이어지는 작업 흐름이다. 유물 전자도면은 유물 형태 검토, 최종 결과물 형태, 특징 view와 단면 위치, 벡터화, 연구자 요구정보, 기준면·좌표계·합치 기준을 따로 남겨야 실측 판단이 파일 산출물 뒤로 사라지지 않는다.

패총·신석기 보강분은 `Feature`에 `shellMiddenStratigraphy`와 `shellMiddenSettlementContext`를 배치해 패총층 유형, 재퇴적·교란, 평면·단면 병행, 하부·관입 유구, 집락 전체 조사구획, 주거지·노지·저장공·매장·의례·밭 후보와 해안·수계 맥락을 함께 남기게 했다. `Find`에는 `neolithicSubsistenceEvidence`를 두어 어망추, 조침, 작살, 골제·패제 어로구, 통나무배, 외양성 어종, 해양포유류, 직접·간접 포경 근거, 어종과 해류의 계절성, 교류품 후보를 유물 카드에서 기록한다. `Sample`에는 `shellMiddenSamplingStrategy`와 `paleoenvironmentProxySampling`을 배치해 층위별 벌크·블록시료, 물체질·부유선별, 패류·어골·동물뼈·식물유체 분리, 화분·규조·식물규산체·탄화곡물·목탄·패류·유공충 프록시, 연대 전처리와 지역 해수면 곡선 연결을 추적한다. 식물유체·탄화곡물 보강분은 `archaeobotanySampleDesign`, `plantRemainSamplingMethod`, `flotationProcessingRecord`, `plantRemainIdentificationRecord`, `archaeobotanyInterpretationReview`, `plantRemainNonDetectionAssessment`로 `Sample`에 배치해 연구질문, 표본추출 방식, 플로테이션 처리 조건, 동정 신뢰도, 분석/해석 분리, 미검출의 조건을 시료 카드에서 직접 관리하게 했다.

청동기 보강분은 `Feature`에 `bronzeAgeDwellingEvidence`, `dolmenStructureContext`, `bronzeAgeEnclosureInterpretation`을 배치해 송국리식·가락동식 같은 유형명을 관찰값 뒤의 후보로 두고, 평면형·화덕·중앙 타원형 구덩이·양단 주혈·벽도랑·주거군/묘역 관계, 고인돌의 덮개돌·받침돌·무덤방·묘역시설·성혈·알구멍·이전복원 이력, 환호의 방어·경계·배수·의례 후보와 내부퇴적·재굴착·수축흔을 분리해 남기게 했다. `Find`에는 `bronzeAgePotteryTerminology`를 두어 민무늬토기/무문토기, 구순각목/골아가리, 공렬/구멍무늬, 이중구연/겹아가리 같은 이칭과 표준 용어, 편년·공반 맥락을 유물 카드에서 추적한다.

충적지·토양도 보강분은 `Survey`에 `alluvialLandformSurvey`와 `soilMapPredictionVerification`을 배치해 자연제방·배후습지·구하도·구해안선·근현대 형질변경, 보링·주상도, 표면유물 부재의 한계, 토양통·대토양군·정밀토양도 반영깊이, 실제 시굴 결과와 예측 수정 사유를 지표조사 단계에서 남기게 했다. `FeatureSegment`에는 `alluvialLayerConceptAudit`, `alluvialSurfaceAttribution`, `alluvialFormationProcess`를 두어 a+b층 세트, 토양층위/퇴적층위/고고학 층명 구분, 구지표면·생활면·유구축조면·검출면, b층 상면 검출, 암색대·이질토 블록·라미나·홍수퇴적 같은 형성과정 근거를 층 세부단위에서 바로 점검한다.

저습지 조사방법 보강분은 `Survey`에 `wetlandAnalysisSource`, `wetlandLandformInterpretation`, `wetlandSurveyTargeting`을 배치하고, `FeatureSegment`에 `wetlandMicrotopographyRecord`를 배치했다. 저습지는 습윤 여부 하나로 판단하지 않고, 중첩 항공사진, 개발 전 항공사진, 고지도, 지질도, 형질변경 지도, 보링자료, 등고선도를 준비한 뒤 지역환경·지형면·미지형·극미지형 분석을 거쳐 고하천, 자연제방, 단구면, 배후습지, 시굴 지점과 조사 범위를 남긴다. 실제 시굴·발굴에서만 보이는 1회성 퇴적, 수전 매몰토층, 배후습지 퇴적, 화분·식물규산체·규조 분석 연결은 층 세부단위에서 다시 기록한다.

경작유구 보강분은 `Feature`에 `cultivationFeatureContext`, `cultivationTrialTrenchStrategy`, `cultivationFeatureEvidence`, `cultivationChronologyAnalysis`를 배치했다. 입지·맥락에서는 구릉지/충적지 고저, 자연제방·배후습지·곡저부 후보, 경지정리와 과거 항공사진, 관개시설, 물관리 방식을 남기고, 작물명만으로 논·밭을 확정하지 않게 했다. 시굴 트렌치에서는 고랑·이랑 또는 논둑과 직교하는지, 경작면 고저차와 층 경계를 확인했는지, 보조 트렌치·분포 범위·기간·안전을 기록한다. 판정 근거는 논둑·논면, 밭 두둑·고랑, 기능면과 기능 후 퇴적층, 라미나·이질토 블록·단립구조·경작구흔·뿌리흔·식물규산체·산화철망간을 분리한다. 연대·분석은 경작층 포함 유물, 선별 평면조사, AMS/OSL, 식물규산체·식물유체·토양미세형태·지방산 시료, 주거지·야외노지·수혈과의 관계를 한 흐름에서 추적한다.

시대별 토기 관찰 보강분은 `Find`에 `ceramicTermScope`, `potteryFabricTemperRecord`, `potteryTemperFunctionAssessment`, `potteryProductionLifeRecord`, `potteryFormingTraceAssessment`, `potteryFormingCaution`, `potteryProcessDirectionality`를 배치했다. 토기·도기·자기·도질토기·스에키 같은 용어 범위는 검색어로 열어두되, 유약 유무, 다공질 태, 소성온도 후보, 원료 점토, 수비, 비짐 재료와 기능, 제작 생애, 성형흔, 조정흔 방향을 유물 카드에서 분리해 남긴다. 특히 실떼기와 회전흔은 물레질 뽑기의 단독 증거로 확정하지 않고, 단일성형 뒤 회전조정, 성형·정형 분리, 기와 성형흔 대조를 함께 확인하게 했다.

토기 소성기술과 토기가마 보강분은 `Find`에 `potteryFiringTraceObservation`, `potteryKilnFurnitureContext`를 배치하고, `Feature`에 `potteryKilnIdentification`, `potteryKilnStructureContext`, `potteryKilnPartInvestigation`, `potteryKilnYardFacility`, `potteryKilnInterpretationRisk`를 배치했다. 토기 표면흔은 부정형·원반형·고리형·점열형·사각형·일자형, 위치, 개수, 간격, 함몰, 연소흔·자연유·흑색 윤과의 구분을 유물 카드에서 남긴다. 요도구 관계는 이상재·이기재 기능 후보, 초본류·모래·할석·내화토·점토덩어리·토기편·전용토제품, 중첩소성 조합과 도치 여부를 표면흔과 연결한다. 토기가마는 소성유구/구조요 판정, 요상 경사 단독판정 금지, 화구·연소부·소성부·연도부·회구부의 부위별 조사, 토취장·태토저장·건조장·공인 생활공간 같은 요장 시설, 최종조업품 자동판정과 회구부 자동연결 금지를 분리해 기록한다. `Sample`에는 `potteryKilnAnalysisPlan`을 두어 숯 AMS·C14, 수종분석, 토기 OSL, 태토 성분분석, 소결 요상·요체 고고지자기 시료를 조사 완료 전 점검하게 했다.

기와가마·와요 보강분은 `Feature`에 `tileKilnStructureContext`, `tileKilnExcavationControl`, `tileKilnPartInvestigation`, `tileKilnOperationSequence`를 배치했다. 요체만 기록하지 않고 요전부, 아궁이, 연소실, 소성실, 연도부, 회구부, 폐기장, 채토공, 제작공방, 건조장, 보관소, 배수시설을 생산공간으로 함께 묶는다. 제토량, 적토장소, 10m 격자 조정, 장축둑과 가마-회구부 연결둑, 구지표·천정 상부·소결 윤곽 보존은 조사 제어 항목으로 분리했다. 부위별 조사에서는 연소실·소성실 분리 근거, 연도 미확인 주의, 회구부 관계 검증, 재층 일부 보존, 층위별 수습을 남긴다. `Find`에는 `tileKilnFindContext`를 두어 생산품, 불량품, 잔여품, 축조재·요도구·보수재, 폐기 후 유입품, 층위별 문양 기록을 구분하고, `Sample`에는 `tileKilnAnalysisPlan`을 두어 C14 위치별 시료, 고고지자기 다지점 시료, OSL 차광, 기와·가마 태토와 소비지 기와 대조를 한 흐름으로 관리한다.

자기요장 보강분은 `Feature`에 `porcelainKilnSiteSystem`, `porcelainWorkshopProcess`, `porcelainKilnStructure`, `porcelainKilnExcavationControl`을 배치했다. 토취장, 원토보관처, 수비공, 태토건조장, 연토장, 성형장, 시유시설, 가마, 폐기장, 생활공간, 수원, 연료원, 운송로, 소비지 비교를 요장 단위 생산체계로 묶고, 공방 공정은 수비·건조·연토·물레성형·굽깎기·시문·유약제조·유약저장·시유 순서로 남긴다. 가마 구조는 요전부, 봉통부, 불턱, 번조실, 노리칸, 불창기둥, 격벽, 창불구멍·마개, 초벌칸, 배연로, 개자리, 연통부를 분리하고, 조사 제어 항목은 등고선 트렌치와 지구물리탐사 병행, 하단 사면 봉통부 탐색, 칸별 사진, 바닥 요도구 위치, 실제 수량 단독추정 금지를 확인한다. `Find`에는 `porcelainFindObservation`, `porcelainKilnFurnitureContext`를 두어 재질·색, 태토, 유색, 시유, 시문, 기형, 기종, 굽, 내저원각, 갑발, 도지미, 굽받침, 모래받침, 포개구이 근거를 기록하고, `Sample`의 `porcelainAnalysisPlan`은 원토·태토·자편·유약·백토·가마벽체·수종·연대·소비지 자편 비교를 한 흐름으로 관리한다.

고고지자기 보강분은 `Sample`에 `archaeomagneticSampleContext`, `archaeomagneticSamplingWorkflow`, `archaeomagneticOrientationRecord`, `archaeomagneticResultQuality`, `archaeomagneticChronologyInterpretation`을 배치했다. 소토 유구 유형과 최종소성면 후보, 파괴 채취 협의, 정방위 큐브·석고 고정·시료번호·주향 표시, pitch·dip·strike와 자북/진북·편각 보정, NRM·교류소자·D/I/L95/K·n/N·D.F.·제외 시료, 한국·일본 표준곡선과 지역차·C14/OSL/층위/형식 편년 대조를 같은 시료 흐름에서 확인하게 했다. 결과값은 “고고지자기 추정연대”로 다루고 단독 확정연대로 쓰지 않는다는 주의도 값 목록에 포함했다.

측구부탄요 보강분은 `Feature`에 `charcoalKilnIdentification`, `charcoalKilnStructurePart`, `charcoalKilnExcavationControl`, `charcoalKilnTraceInterpretation`을, `Sample`에 `charcoalKilnAnalysisPlan`을 배치했다. 낮은 피열흔 때문에 성격불명 소토유구로 흘러가는 것을 막기 위해 측구식·무측구식, 백탄·흑탄·겸용 후보, 지하식·반지하식·반지상식·지상식, 소성부·연소부·분구·연도·연통·측구·측구폐쇄석·측면작업장·외부배수구, 장축·단축 토층둑, 중앙 트렌치 보류, 폐쇄석 원위치, 피열색·천정부 초류흔·굴지구흔, 목탄·주혈 탄화목·수종분석·C14·고고지자기·OSL 시료를 한 흐름으로 점검하게 했다.

이 구현 단위가 먼저 들어가야 각 유적 유형별 템플릿을 만들 때 기록이 흩어지지 않는다.

동물유체·화석환경 보강분은 `faunalRecoverySampling`, `faunalPreservationHandling`, `zooarchaeologicalIdentification`, `boneSurfaceModification`, `zooarchaeologicalQuantification`으로 `Sample`에 배치했다. 큰 뼈만 선별해 생기는 왜곡, 소형 어류·조류·설치류·미세 패각·어린 개체 누락, 산성토양·패총·석회암동굴·저습지의 보존 조건, 전체 체질과 체눈, 블록샘플 치수와 반복 채취, 토양 지지 상태 유지, 동물종·부위·좌우·성장단계 동정, 절단흔·화흔·포식흔·풍화, NISP·MNE·MNI·MAU·%MAU 산출 방식과 한계를 함께 남기게 했다.

## 검증 질문

샘플 프로젝트는 다음 질문을 통과해야 한다.

1. 하루 작업기록에서 보고서 도면·사진·목록까지 원기록 ID가 이어지는가.
2. 현장 종료 전에만 확인 가능한 값이 비어 있으면 경고되는가.
3. 지표·표본·시굴에서 정밀발굴로 넘어갈 때 자료 인계가 추적되는가.
4. 시료가 분석명만이 아니라 분석 질문과 채취 맥락을 갖는가.
5. 표준 용어와 현장 관용어를 모두 검색하되 저장값은 권위어로 정규화되는가.
6. 판단 보류가 확정값으로 덮이지 않고 검토 이력으로 남는가.
7. 전문가 검토회의와 부분완료 제출 패키지가 원도면·사진·유물현황·조사기관 의견과 연결되는가.
8. 유물 꼬리표의 일련번호, 좌표, 깊이, 치수, 무게, 유물대장, 고유 등록번호, 정리번호가 끊기지 않는가.
9. 동물유체 시료가 큰 뼈 선별이 아니라 체질·블록시료·동정 불확실성·NISP/MNI 등 계량 한계를 함께 남기는가.
10. 제철유적 공정 판단이 노 형태명 하나가 아니라 구조·부산물·금속학 분석계획을 함께 요구하는가.
11. 고분·분묘 기록이 묘형명 하나가 아니라 조사 목적, 봉분 트렌치, 성토 세분, 석곽 벽체, 내부 수습, 묘도·연도 폐쇄, 관대·시상, 제사·매납 위치, 봉토·매장주체부·부장품 위치·인골 수습 기준으로 분리되는가.
12. 성곽 부속시설이 성문·암문·수문·여장·왜성 해자의 이름이 아니라 방어·배수·이동 기능과 잔존·보수 상태로 분리되는가.
13. 충적지·경작유구 기록이 표면유물 부재, 색조, 작물명 하나로 확정되지 않고 고지형·토양도·층 개념·분석시료와 함께 검증되는가.
14. 요업유적 기록이 토기·기와·자기 가마 형식명 하나가 아니라 생산공간, 부위별 조사, 출토품 맥락, 분석시료와 소비지 대조로 이어지는가.
15. 보존과학 기록이 실내 후처리로 밀리지 않고 노출·수습·임시보관·분석 의뢰·파괴분석 승인·처리 원칙을 현장 단계에서 추적하는가.
16. 저습지 조사가 현재 습윤 여부 하나가 아니라 항공사진·고지도·보링자료·지형 단계 판독·시굴 위치·극미지형 기록으로 이어지는가.
17. 사진·도면·GPS 기록이 첨부파일 묶음이 아니라 위치품질, 원천자료, 좌표계, 실측 기준, 3D 후처리, 보고서 교차검토를 가진 증거 기록으로 남는가.
18. 측구부탄요와 고고지자기 시료가 낮은 피열흔·구조부위·토층둑·폐쇄석 원위치·시료 방위·결과 품질·복수 편년 대조를 한 흐름으로 남기는가.
19. 일지와 품질검수가 개인 야장, 당일 사실기록, 원매체 보존, 수정 사유, 보고서 평가 환류를 원기록 ID와 함께 추적하는가.
20. 지표조사가 표면 유물 유무만이 아니라 조사 범위, 전문분야, 지도요건, 조사 시점, 증거 부재 근거, 주변 자원, 표면 채집 유물 처리까지 함께 남기는가.
21. 청동기 취락·고인돌·환호·토기 기록이 유형명과 관용어를 바로 확정하지 않고 관찰값, 조사절차, 공반·편년 근거, 대안 해석과 함께 남기는가.
22. 층위와 유구 내부토 기록이 색조·층명 하나로 닫히지 않고 관찰 절차, 층명 체계, 토성 판정, 오인 후보, 축조·사용·폐기·매몰 과정을 함께 남기는가.
23. 생토·부식토·교란토 같은 층명이 절대값으로 저장되지 않고 조사대상시대와 관계유구 기준으로 검토되는가.
24. 식물유체·탄화곡물 시료가 채취 위치, 처리 전 토양량, 물체질·플로테이션, 체눈, 동정 신뢰도, 분석/해석 분리, 미검출 조건을 함께 남기는가.
25. 토기와 신석기 생업 유물이 형식명·어구명 하나로 닫히지 않고 태토·비짐·성형흔·공정방향성·생업 증거 수준을 함께 남기는가.
26. 공개·실험·해외조사·국내 제도 리스크 기록이 홍보 문구나 행사명으로 닫히지 않고 공개등급, 민감정보, 매체 권리, 실험 변수·반복·실패값, 기관 역할, 현지 법제·허가·반출 제한, 구제발굴 일정 압박·과학분석 배제와 연결되는가.
27. 성곽 축조·정비·복원 기록이 판축·복원 같은 결과명으로 닫히지 않고 협판·고정주·달구질흔, 기초·기저부, 붕괴 성돌·해체 단면, 문헌·사진·용척·원부재·복원 제외 근거와 연결되는가.
28. 원문 도표·사진·표·캡션·사례명·한자·수치가 값목록으로 바로 승격되지 않고, `SourceEvidenceIndex`에서 적용 영역, 대조 상태, 사용 목적과 함께 추적되는가.
29. 측량·사진·도면·안전·민원·유물정리·시료·일지·보고서 책임과 검토자가 일지 문장 속에 묻히지 않고 `operationRoleResponsibility`로 구조화되는가.
30. 허가서 비치, 보안, 주민·관할기관 통보, 유적보호 주의사항, 기상 대비, 야간방범, 임시유물·기록물 보관이 행정 메모가 아니라 `Operation`의 `siteProtectionSecurity`로 남는가.
31. 구획·둑·배수·장비 제토·기준단면·안전휀스·철수 전 기록물 점검이 일지 문장 속에 묻히지 않고 `Operation`의 `excavationControlSafety`로 검수되는가.
32. 발굴맥락이 유구명 하나로 닫히지 않고 유적·유구·유물·유물복합체·환경 연결, 수평분포·수직층위, 조사방법 선택근거와 함께 남는가.
33. 표토·현대교란·도굴갱·상부퇴적토·유구 매몰토 제거와 축조면·사용면·폐기면 확인이 행위의 역순 원칙으로 검토되는가.
34. 유구·유물 해석이 연구질문, 관찰·해석 분리, 대안해석, 자연·후퇴적 가능성, 분석결과 영향, 보고서 채택 근거와 함께 남는가.

2026-06-19 검증 샘플은 `docs/korean-fieldwork/samples`에 둔다. `field-record-preservation-sample.json`은 수혈건물지 후보의 최초 노출, 내부층, 유물, 시료, 사진, 도면이 같은 작업기록으로 이어지는지 확인하고, `media-drawing-gps-workflow-sample.json`은 GPS/NMEA, 사진 위치연동, 고지도·분포도 작성, 유물실측, 수침목재 습식 실측, 3D 원천자료 보존이 같은 매체 증거 흐름으로 검수되는지 확인한다. `daily-log-quality-review-workflow-sample.json`은 개인 야장 공적기록화, 당일 작업일지, 작업 역할·책임, 제토·둑·안전 관리, 사진·도면·유물·시료 목록 대조, 수정 사유, 원기록 보존, 보고서 평가 환류가 독립 `DailyLog`와 `FieldRecordQualityReview` 카드로 이어지는지 확인한다. `stage-transition-handover-sample.json`은 지표조사·표본조사·시굴조사에서 정밀발굴 전환과 후속기관 인계가 이어지는지 확인한다. `administrative-workflow-sample.json`은 조사의뢰 접수, 계획 변경, 현장 보호·보안, 전문가 검토회의, 부분완료, 지표조사 결과 처리, 자료 인수인계가 실제 값목록으로 표현되는지 확인한다. `surface-survey-scope-absence-sample.json`은 지표조사 범위·전문분야·지도요건·시점 검토, 표면 증거 부재 근거, 비유적 자원조사, 표면 채집 유물 처리가 하나의 후속조사 판단 흐름으로 이어지는지 확인한다. `artifact-label-register-sample.json`은 현장 꼬리표, 유물대장, 고유 등록번호, 정리번호가 같은 `Find` 기록에서 이어지는지 확인한다. `term-authority-alias-sample.json`은 현장 관용어와 권위 표제어가 같은 저장값으로 섞이지 않는지 확인한다. `faunal-recovery-quantification-sample.json`은 패총 동물유체 시료가 물체질, 블록시료 치수, 보존 취급, 동정 불확실성, NISP·MNE·MNI·MAU·%MAU 한계와 함께 남는지 확인한다. `archaeobotany-flotation-workflow-sample.json`은 식물유체·탄화곡물 시료가 채취 맥락, 처리 전 토양량, 물체질·플로테이션, 체눈, 동정 근거, 분석/해석 분리, 미검출 평가와 함께 남는지 확인한다. `pottery-technology-subsistence-workflow-sample.json`은 토기편과 신석기 생업 유물이 용어 범위, 태토·비짐, 비짐 기능, 제작 생애, 성형흔, 공정 방향성, 어구·해양자원 증거 수준을 분리하는지 확인한다. `iron-production-workflow-sample.json`은 제철유적의 노 구조, 부산물 세분, 파괴분석 승인, 금속학 분석계획이 공정 확정 전에 함께 남는지 확인한다. `bronze-age-settlement-dolmen-workflow-sample.json`은 청동기 수혈건물지, 고인돌·지석묘, 환호, 무문토기·민무늬토기 기록이 관찰값·조사절차·권위어·공반·편년 근거를 분리하는지 확인한다. `stratigraphy-feature-lifecycle-workflow-sample.json`은 층위 관찰 절차, 층명 체계, 토성 판정, 내부토 해석, 이질토 블록, 매몰 과정, 색조·후성변형 오인 방지와 발굴맥락 구성이 `Feature`와 `FeatureSegment` 기록으로 남는지 확인한다. `tomb-burial-workflow-sample.json`은 고분·분묘의 조사 목적, 봉분 트렌치, 성토 세분, 석곽 벽체, 내부 수습, 석실 묘형 보류, 묘도·연도 폐쇄, 관대·시상 사용, 제사·매납 위치, 봉토·분구, 매장주체부, 부장품 위치 맥락, 인골 수습 기준이 묘형명 하나로 접히지 않는지 확인한다. `fortification-facility-workflow-sample.json`은 성곽의 성문·암문·여장, 수문·은구, 왜성 해자가 부재·기능·잔존 상태로 분리되는지 확인한다. `fortification-construction-restoration-sample.json`은 판축 후보 성벽 단면, 기초·기저부, 보수·정비, 복원·중건 근거가 같은 성곽 기록에서 이어지는지 확인한다. `alluvial-landform-layer-workflow-sample.json`은 충적지 지표조사, 토양도 예측, a+b층·검출면 판정, 경작유구와 고환경 시료가 표면유물 부재나 작물명 하나로 접히지 않는지 확인한다. `wetland-survey-microtopography-sample.json`은 저습지 지형판독이 항공사진·고지도·보링자료, 고하천·자연제방·단구면·배후습지 표시, 시굴 위치, 매몰 수전·1회성 퇴적·미화석 시료로 이어지는지 확인한다. `ceramic-kiln-production-workflow-sample.json`은 토기가마·기와가마·자기요장이 생산공간, 부위별 조사, 출토품 맥락, 분석계획, 소비지 비교로 이어지는지 확인한다. `charcoal-kiln-archaeomagnetic-workflow-sample.json`은 측구부탄요가 낮은 피열흔·측구·폐쇄석·토층둑·목탄시료와 고고지자기 정방위 시료, 방위 보정, 결과 품질, 복수 편년 대조로 이어지는지 확인한다. `conservation-science-fieldwork-sample.json`은 수침목재·칠기·금속·토도류·지류·직물·인골·토양 시료가 현장 수습과 분석·보존처리 결정으로 이어지는지 확인한다. `public-research-governance-sample.json`은 공개 후보 사진·3D 도면, 공개등급, 매체 권리, 현장설명회, 실험 설계, 해외조사 리스크, 국내 제도 리스크, 연구 역할 분담이 같은 사업·작업기록에서 이어지는지 확인한다. `source-evidence-index-sample.json`은 도표·사진·표·캡션·사례명·한자·수치가 `SourceEvidenceIndex`에서 원문 대조 상태와 사용 목적을 가진 채 남는지 확인한다. 스물네 샘플은 `korean-fieldwork-configuration.spec.ts`에서 실제 폼과 값목록 키를 쓰는지 검증한다.
