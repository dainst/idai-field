# 현장 현상별 관찰·기록 매트릭스

이 문서는 『한국 매장문화재 조사연구방법론』과 『제철유적 조사·분석 방법론』을 읽으면서 뽑은 “현장에서 무엇을 관찰하고 기록해야 하는가”의 중간 종합이다. 원문 요약이 아니라 iDAI.field를 한국형 야장으로 바꾸기 위한 기록 원칙으로 재정리했다.

## 1. 발굴은 유구·유물 수습이 아니라 증거 사슬 구축이다

제1권의 총론은 발굴조사를 유구 확인과 유물 수습에 머물게 해서는 안 된다고 본다. 발굴은 과거 사람들의 생활사와 문화적 의미를 복원하기 위한 자료 수집 과정이며, 발굴 과정에서 얻어진 정보와 해석 곤란, 잘못된 과정까지 기록해야 이후 반복 실수를 피하고 새로운 해석 가능성을 남길 수 있다.

따라서 한국형 야장은 다음을 기본 전제로 삼아야 한다.

- 관찰 사실과 해석을 분리한다.
- 해석 근거와 대안 해석을 남긴다.
- 수습·분석·보존·보고서 반영까지 한 기록 ID로 추적한다.
- 잘못된 판단, 교란, 불확실성, 조사 제약을 숨기지 않는다.
- 현장 기록은 보고서의 부속물이 아니라 보고서와 데이터베이스의 원자료다.

근거로 삼은 대목:

- 제1권: 발굴 목적, 정밀 발굴, 과학 분석, 발굴 과정 기록과 정확한 보고서 필요성
- 제1권: 발굴보고서 제작 파일, 사진·도면·분류정보의 전자화와 데이터베이스화

## 2. 공통 기록 단위

모든 유적 유형에서 최소한 다음 기록 단위는 분리되어야 한다.

| 기록 단위 | 현장에서 붙잡아야 할 것 | iDAI.field 반영 방향 |
| --- | --- | --- |
| 조사사업 | 허가, 기간, 조사 목적, 조사기관, 조사 조건 | `Project`, `Operation` |
| 조사구역 | 구역, 그리드, 트렌치, 기준점, 좌표계 | `Trench`, `Area`, `Operation` |
| 층·퇴적 단위 | 색, 입도, 구조, 경계, 형성 원인, 문화층/자연층 판단 | `Layer`, `StratigraphicUnit` 후보 |
| 유구 | 형태, 규모, 방향, 절단 관계, 축조·사용·폐기 흔적 | `Feature`, 유형별 확장 |
| 유물 | 출토 맥락, 수습 위치, 재질, 상태, 보존·분석 필요성 | `Find`, 재질별 하위 범주 |
| 시료 | 채취 목적, 위치, 층위, 오염 가능성, 포장·보관, 분석 의뢰 | `Sample`, `Analysis` |
| 매체 | 사진, 도면, 3D, GIS, 파일 경로, 촬영·측량 조건 | `Photo`, `Drawing`, `Document` |
| 보존·수습 | 노출 시점, 응급처치, 포장, 반출, 보관, 후속 처리 | `ConservationAction` 후보 |
| 검토·보고 | 검토자 의견, 수정 이력, 보고서 반영 여부 | 작업기록/상태 필드 |

## 3. 현상별 관찰 매트릭스

| 현장 현상 | 반드시 관찰할 것 | 기록 필드 후보 | 책에서 읽은 원칙 |
| --- | --- | --- | --- |
| 층위와 퇴적 | 색, 입도, 점성, 포함물, 경계 명료도, 절단·교란, 자연/문화층 판단 | `soilColor`, `grainSize`, `inclusions`, `boundary`, `formationInterpretation`, `uncertaintyReason` | 충적지와 밭유구는 자연퇴적층 오인이 가능하므로 판정 근거를 남겨야 한다. |
| 건물지 | 주공, 초석, 기단, 벽체, 바닥, 배수, 화덕, 개수·소실 흔적 | `buildingElement`, `constructionPhase`, `floorSurface`, `postholeGroup`, `burnEvidence` | 건물지는 단일 유구가 아니라 구조 요소와 축조 단계의 관계망이다. |
| 성곽 | 구간, 체성 내외부, 기초다짐, 협판·고정주·횡장목·달구질흔, 보축, 해자, 문지 | `fortificationSegment`, `constructionEvidence`, `foundationTreatment`, `revetment`, `ditch`, `gate` | 판축·성토 같은 명칭은 증거가 있을 때 붙이고, 근거가 약하면 대안 해석을 기록한다. |
| 고분 | 봉토, 묘광, 매장주체부, 관·곽, 폐쇄시설, 추가장, 교란, 부장품 위치, 인골 자세 | `burialStructure`, `burialEvent`, `graveGoodsPosition`, `humanRemainsPosition`, `disturbance` | 고분은 매장 행위의 순서와 위치 관계가 핵심이다. |
| 패총 | 패각층, 패각 종류, 층 두께, 토기·석기·골각기, 동물유체, 화덕, 주거, 의례·교류 흔적 | `shellLayer`, `shellSpecies`, `associatedFinds`, `ecofacts`, `subsistenceEvidence` | 패총은 생업, 생활, 자연환경, 교류를 함께 담는 복합 자료다. |
| 밭유구 | 이랑·고랑면, 발자국, 경작구흔, 뿌리흔, plant-opal, 토양미세형태, 상·하층 관계 | `fieldSurface`, `furrowRidge`, `cultivationTrace`, `microMorphologySample`, `phytolithSample` | 밭은 자연층과 혼동될 수 있으므로 기능면과 층 내부 판정요소를 함께 기록한다. |
| 생산유적 | 원료, 연료, 노·가마 구조, 송풍, 배출, 부산물, 실패품, 폐기장, 열변색 | `productionProcess`, `rawMaterial`, `fuel`, `firingStructure`, `technicalResidue`, `slagDistribution` | 생산유적은 형태보다 공정 단계와 부산물의 관계가 중요하다. |
| 제철유적 | 채광·선광·배소·제련·단야·용해·초강 단계, 노벽, 슬래그, 송풍관, 철괴, 목탄, 시료 선정 | `ironProcessStage`, `furnaceWallZone`, `slagType`, `tuyere`, `metallurgicalSample`, `charcoalSample` | 발굴 전 분석 계획을 세우고, 폐기장 규모에 따라 전수 또는 통계적 수거를 선택해야 한다. |
| 인골·동물유체 | 해부학적 위치, 자세, 방향, 보존 상태, 오염 가능성, 수습 순서, 보관 조건 | `anatomicalPosition`, `orientation`, `preservationState`, `collectionOrder`, `storageCondition` | DNA·동물고고학 등 분석은 수습과 보관 단계에서 신뢰도가 갈린다. |
| 자연과학 시료 | 분석 목적, 적정 방법, 파괴 여부, 채취 위치, 채취량, 포장, 냉장/냉동, 오염 위험 | `analysisPurpose`, `methodCandidate`, `samplingContext`, `sampleAmount`, `contaminationRisk`, `storageTemperature` | 분석 대상과 목적에 맞는 방법을 고르고, 결과의 한계까지 검토해야 한다. |
| 3D·측량 | 기준점, 좌표계, 스캔 위치, 타겟, 점밀도, 폐색영역, 정합, 검사측량, 파일 | `controlPoint`, `coordinateSystem`, `scanStation`, `targetType`, `pointDensity`, `occlusion`, `registration`, `checkSurvey` | 3D 데이터는 파일 첨부가 아니라 좌표·정확도·후처리 이력이 있는 측량 기록이다. |
| 보존·응급처치 | 노출 시점, 재질, 수분 상태, 손상, 세척 여부, 라벨, 포장, 반출, 사진·도면 | `exposureDate`, `materialState`, `damage`, `cleaningDecision`, `labeling`, `packing`, `transport` | 노출 직후부터 변질이 시작되므로 수습과 응급처치 자체를 기록해야 한다. |

## 4. 현장 기록 화면으로 바꾸면 필요한 묶음

### 오늘의 작업

- 조사일
- 조사구역
- 참여자
- 날씨와 현장 조건
- 오늘의 목표
- 실제 진행
- 중단·제약 사유
- 검토 필요 사항

### 관찰 카드

- 관찰 대상: 층, 유구, 유물, 시료, 보존조치, 매체
- 관찰 사실
- 해석
- 해석 근거
- 불확실성
- 대안 해석
- 확인 필요 작업

### 수습 카드

- 수습 대상
- 수습 위치
- 수습 방식
- 라벨·포장 정보
- 보관 조건
- 응급처치
- 분석 필요성
- 보고서 반영 상태

### 분석 카드

- 분석 질문
- 시료 선택 이유
- 분석 방법 후보
- 파괴/비파괴 여부
- 분석기관
- 결과
- 결과 해석
- 한계와 재검토 필요성

### 매체 카드

- 사진·도면·3D·GIS 종류
- 대상 기록 ID
- 촬영·작성·측량자
- 방향·축척·좌표계
- 파일 경로
- 후처리 상태
- 보고서 사용 여부

## 5. 다음 독해 과제

2·3·5·6권은 이미지 기반 스캔본이라 후속 OCR이 필요하다. 특히 다음 항목은 OCR 후 세부 필드를 보강한다.

- 제2권: 석기 관찰, 석기 작도, 패총·인골·동물유체 수습, 고환경 분석
- 제3권: 건물지 세부 구조 요소와 조사 순서
- 제5권: 고분 유형별 매장주체부와 부장품·인골 수습
- 제6권: 충적지 층 구분, 단면 기록, 고지형 분석, 토양조사

## 6. iDAI.field 개조 방향

아직은 코드를 크게 바꾸기보다 한국형 구성 파일을 별도로 두는 것이 안전하다. 첫 구성은 기존 범주를 유지하고, 한국형 필드 그룹을 추가한다.

우선 적용할 기존 범주:

- `Project`, `Operation`, `Trench`
- `Layer`, `Feature`
- `Find`, `Grave`, `Building`
- `Sample`
- `Photo`, `Drawing`

새 범주를 만들기 전에 먼저 필요한 필드:

- 관찰 사실
- 해석
- 해석 근거
- 불확실성 사유
- 확인 필요 작업
- 수습 방식
- 분석 목적
- 보존·응급처치
- 보고서 반영 여부
