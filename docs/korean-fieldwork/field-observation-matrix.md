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
| 층위와 퇴적 | 색, 입도, 점성, 포함물, 경계 명료도, 절단·교란, 검출면, 소속 층위, 층간 대비, 산화철·망간, 지하수 영향, 생물교란, 자연/문화층 판단, 건층 후보, 축조면·사용면·검출면 구분 | `soilColor`, `grainSize`, `inclusions`, `boundary`, `horizonConcept`, `stratigraphicCorrelation`, `formationInterpretation`, `keyBedCandidate`, `featureSurface`, `uncertaintyReason` | 충적지 조사는 층 구분과 해석에서 시작한다. 색 차이만으로 층을 나누지 말고 구성 물질과 퇴적구조, 2차 변질, 건층, 유구 소속층위를 함께 기록해야 한다. |
| 토양조사 | 토양생성인자, 모재, 잔적/운적 여부, 토양 단면, 토심, 토색, 토성, 구조, 반문, 점토피막, 자갈 함량·크기, 지하수위, 배수상태, 토양반응, 산화·환원 상태, 정밀토양도, 토양조사보고서, 항공사진 판독, 토양통·토양상·대토양군, 구해안선·해수면 변화, 유물보존능, 토양도 기반 예측과 실제 조사 결과 | `soilFormationContext`, `soilProfileObservation`, `parentMaterial`, `soilSurveyMapReference`, `soilTaxonomyReference`, `soilHorizonObservation`, `soilDrainage`, `redoxCondition`, `artifactPreservationPotential`, `aerialPhotoSoilInterpretation`, `soilMapPrediction`, `soilMapVerification`, `paleoShorelineInference`, `soilPreservationClass` | 토양은 기후·지형·모재·생물·시간이 만든 3차원 자연체이지만, 고고학에서는 유물이 묻힌 포장지 하부·습지·갯벌도 토양 맥락으로 다룰 수 있다. 정밀토양도는 현재 지표 아래 1~2m 안팎의 조건을 주로 반영하므로 유적 부재를 확정하는 도구가 아니라, 대토양군을 재정리해 지형면 후보와 시굴 범위를 세우고 실제 조사로 검증하는 도구로 써야 한다. 회색토도 배제값이 아니라 배후습지, 자연제방, 구해안선, 해수면 변화, 산소 차단 보존 조건을 함께 묻는 값이다. |
| 지표·고지형 분석 | 표면 유물 부재, 위성사진, 시기별 항공사진, 실체경 판독, 고지도, 지형도, 지질도, DEM, 형질변경 지도, 시추자료, 산지·구릉·평야, 선상지, 자연제방, 배후습지, 구하도, 단구, 미고지, 현지답사 보정, 시굴 추천 지점 | `paleoLandformSurvey`, `landformInterpretationMap`, `remoteSensingSource`, `aerialPhotoDate`, `demSource`, `landformAnalysisStage`, `paleoLandformType`, `fieldVerification`, `trialTrenchRecommendation` | 평야와 논 지역은 표면 유물로 유적을 판단하기 어렵다. 고지형 분석은 매몰 구지형과 유적 가능성을 과학적으로 제시하고, 시굴 트렌치의 위치·방향·깊이·밀도를 정하는 근거가 되어야 한다. |
| 충적지 취락 | 자연제방 전사면·상면·후사면, 배후습지, 구하도, 하천 방향, 지표조사 자료, 격자·트렌치, 주상도, 문화층 수, 제토 깊이, 장비 동선, 주거·무덤·밭·논·노지·수혈·도로·의례유구 관계, 정리작업 상태 | `alluvialSettlementModel`, `microLandformUnit`, `trialTrenchSurvey`, `profileColumn`, `machineStrippingRecord`, `settlementSpace`, `featureFillProcess`, `fieldworkRegisterLink` | 충적지 취락은 개별 유구보다 지형·퇴적 환경 속의 관계가 중요하다. 자연제방과 배후습지를 구분하고, 시굴 주상도와 제토 기록을 근거로 유구 배치와 유적의 생성·발달·소멸을 읽어야 한다. |
| 고환경 분석 | 조사 범위, 집수유역, 분수계, 광역·주변·미세지형, 수계, DEM·등고선·수준점 자료, 경사도, 사면 방향, 지질, 토층 단면, 시추 시료, 입도, 퇴적상, 간극수·유기물·토양 지구화학, 화분·규조·유공충·패류·식물규산체, 연대자료, 1D/2D/3D 복원 | `paleoenvironmentStudyArea`, `catchmentArea`, `geomorphometryAnalysis`, `demSource`, `geoarchaeologicalSample`, `sedimentologyAnalysis`, `geochemicalAnalysis`, `microfossilAnalysis`, `paleoenvironmentUnit`, `reconstructionDimension`, `datingPurpose` | 고환경은 현재 지형 설명이 아니라 유적 당시와 이후의 자연환경 변화를 복원하는 일이다. 유적 경계를 넘어 집수유역과 주변 지형을 잡고, 현장 단면·시추 시료를 실험실 분석 결과와 다시 연결하며, 보존 조건·운반·재퇴적·복원 한계를 함께 남겨야 한다. |
| 선사·석기 산포 | 석기 출토 위치, 3차원 좌표, 방향성, 산포 밀도, 원재료, 박리 흔적, 제작기법, 잔손질 정도·각도·위치, 작업날 위치, 유물 조성, 접합군, 미세 격지, 체질 단위, 도면 상태, 홍수·침식·재퇴적, 생물교란, 미세구조 관찰 필요성 | `lithicFind`, `threeDimensionalPosition`, `artifactOrientation`, `rawMaterial`, `knappingTechnique`, `retouchAttribute`, `workingEdge`, `refitGroup`, `sievingUnit`, `drawingStatus`, `postDepositionalProcess`, `culturalProcessEvidence` | 선사 유적은 자연현상과 문화현상을 먼저 분리해야 한다. 접합은 제작장 판단의 단독 근거가 아니며, 석기 도면과 형식명은 관찰값과 수습 맥락을 근거로 관리한다. |
| 건물지 | 주공, 초석, 기단, 벽체, 바닥, 배수, 화덕, 출입부, 저장·침상 시설, 집자리/집터 구분, 유물 원위치, 기와·전돌 속성, 초석설치굴광·발취공·폐기공, 적심석, 보강토, 기단외장, 계단, 낙수구, 비계 주공, 기준 말뚝, 배치축, 칸수, 주간거리, 영조척 후보, 어깨선·도리선, 서까래 밑동 후보, 내진/외진, 결구방식, 가구형식, 지붕형식, 용마루·까치구멍, 벽체 구법, 배연·난방, 개수·소실 흔적, 동시성, 복원 근거, 복원 대안 | `buildingElement`, `constructionPhase`, `floorSurface`, `postholeGroup`, `inSituFindDistribution`, `roofTileAttributeSet`, `stoneBaseTrace`, `constructionSupportTrace`, `architecturalModule`, `structuralLine`, `woodenStructuralSystem`, `roofHypothesis`, `wallEntranceHeating`, `burnEvidence`, `restorationEvidence`, `reconstructionHypothesis`, `useLifePhase` | 건물지는 단일 유구가 아니라 구조 요소와 축조 단계의 관계망이다. 평면 노출만으로 끝내지 말고 유물 원위치, 건축부재 속성, 사라진 초석의 흔적, 생활공간, 칸과 영조척, 목조건축 결구·가구·지붕 가설, 중복 주거지의 동시성과 복원 근거를 함께 기록한다. |
| 성곽 | 성벽 통과선, 잔존·수리·유실구간, 구지표, 정지면, 기조, 지정목, 잡석다짐, 지대석, 수평기단·사직선기단, 협판·고정주·횡장목·달구질흔, 판괴연접, 호성파, 역경사판축, 부엽공법, 내탁·협축, 바른층쌓기·허튼층쌓기·물려쌓기, 문지, 암문, 옹성, 적대, 치성, 여장, 우물, 집수시설, 수문·수구, 해자, 목익, 양마장, 조교·적교, 성내 건물지, 각자성석, 면석 이탈·붕괴·배부름·지반침하·수목 | `fortificationSegment`, `rampartFoundation`, `constructionEvidence`, `rammedEarthBlock`, `fortificationWallTechnique`, `revetment`, `gate`, `ongseong`, `bastion`, `parapet`, `waterFacility`, `ditch`, `inscribedWallStone`, `fortificationRepairPhase`, `fortificationConservationRisk` | 성곽은 구간·단면·부속시설·수리 이력을 함께 기록해야 한다. 판축·성토 같은 명칭은 협판·고정주·달구질흔 등 증거가 있을 때 붙이고, 정비 전 발굴자료가 보수설계로 넘어가도록 성돌 보관, 3D스캔, 조사 전·중·후 사진, 수리보고서까지 추적한다. |
| 고분 | 봉토, 묘광, 매장주체부, 관·곽, 묘도·연도, 폐쇄시설, 추가장, 교란, 부장품 위치군, 부장품 성격, 제사유물, 동물희생, 음식물, 인골 자세, 개방 전 내부환경 | `burialStructure`, `moundElement`, `burialEvent`, `graveGoodsPosition`, `graveGoodsRole`, `ritualDeposit`, `humanRemainsPosition`, `sealedChamberCondition`, `disturbance` | 고분은 매장 행위의 순서와 위치 관계가 핵심이다. 부장품은 종류보다 출토 위치와 성격 분류가 중요하고, 제사자료는 축조 공정 단계와 부장/공헌 구분을 함께 남긴다. |
| 패총 | 패각층, 패각 종류, 층 두께, 패각 밀도, 패각 크기, 파쇄도, 보존상태, 퇴적물 구성, 사면/해안 영향, 해수면·해안선 변화, 해안 모래 유입, 조류·파랑 운반, 재퇴적 가능성, 토기·석기·골각기, 결합식 낚시어구, 어망추, 그물흔 토기, 동물유체, 해양포유류, 화덕, 주거, 무덤, 의례·교류 흔적 | `shellLayer`, `shellSpecies`, `shellDensity`, `shellFragmentation`, `depositionProcess`, `redepositionRisk`, `associatedFinds`, `ecofacts`, `subsistenceEvidence`, `marineResourceEvidence`, `exchangeEvidence` | 패총은 생업, 생활, 자연환경, 교류를 함께 담는 복합 자료다. 패각층의 공반관계는 퇴적·재퇴적 과정을 검토한 뒤 사용하고, 체질·표본 채취 방식에 따라 자료 신뢰도를 구분한다. |
| 신석기 토기 | 저부 형태, 기종, 태토, 비짐, 소성도, 색조, 문양기법, 문양위치, 문양종류, 구순각목, 지역권, 편년 후보, 문양 퇴화·무문화 단계 | `neolithicPotteryBase`, `neolithicPotteryFabric`, `temper`, `vesselForm`, `decorationTechnique`, `decorationMotif`, `decorationZone`, `regionalSequence`, `chronologyCandidate`, `interpretationStatus` | 신석기 토기는 형식명을 먼저 붙이면 지역성과 시기성이 뭉개진다. 고산리식·오산리식·영선동식·수가리식 같은 명칭은 저부·태토·문양·기종 관찰값이 쌓인 뒤 해석값으로 확정한다. |
| 논·밭유구 | 논둑·두둑, 경작면, 고랑, 경작토층, 기능면, 기능 후 퇴적층, 라미나 부재, 이질토 블록, 단립구조, 발자국, 경작구흔, 작물재배흔, 뿌리흔, 밭잡초, 산화철·망간, plant-opal, 토양미세형태, 상·하층 관계, 주거지·노지·수혈과의 선후관계, AMS·OSL | `fieldSurface`, `paddySurface`, `furrowRidge`, `cultivationTrace`, `fieldFormationCriteria`, `ironManganeseFeature`, `microMorphologySample`, `phytolithSample`, `datingSample`, `featureRelationship` | 논·밭은 자연층과 혼동될 수 있으므로 기능면과 층 내부 판정요소를 함께 기록한다. 문암리 사례처럼 신석기 밭은 이랑·고랑뿐 아니라 주거지 절단 관계, 토기·석촉, OSL·AMS, 식물규산체와 토양미세형태 분석이 함께 있어야 한다. |
| 생산유적 | 원료, 연료, 노·가마 구조, 송풍, 배출, 부산물, 실패품, 폐기장, 열변색 | `productionProcess`, `rawMaterial`, `fuel`, `firingStructure`, `technicalResidue`, `slagDistribution` | 생산유적은 형태보다 공정 단계와 부산물의 관계가 중요하다. |
| 제철유적 | 문헌·지명·탐문 단서, 계곡·구릉 말단 지표조사, 채광·선광·배소·제련·정련단야·단련단야·성형단야·용해·초강 단계, 노벽, 송풍구, 송풍관, 노바닥, 지하방습시설, 배재부, 출탕구, 용범, 철재, 유출재, 노내재, 완형재, 단조박편, 입상재, 철괴·반환원괴, 목탄, 조재제, 폐기장 수습 방식, 격자 토양시료, 목탄요·채토장·집수시설·도로·제의유구, 분석 계획, 시편 절단·성형·연마, 원소값과 산화물 변환, FAS·FCS 상태도, 염기도, AMS·TL/OSL·고고지자기, 수종분석, 전통 주조기술 비교 | `ironSurveyLead`, `ironProcessStage`, `ironFeatureType`, `furnaceComponent`, `undergroundMoistureControl`, `slagTappingArea`, `castingMold`, `castingOutlet`, `slagType`, `forgingScaleGrid`, `ironWasteDeposit`, `metallurgicalSample`, `charcoalSample`, `ironAnalysisPlan`, `ironSamplePreparation`, `ironOxideInterpretation`, `ironDatingSample`, `ironWoodSpeciesSample`, `ironAuxiliaryFacility`, `ironRitualDeposit` | 제철유적은 노 형태만으로 판단하지 않는다. 구조, 부산물, 폐기장, 토양시료, 자석반응, 금속학 분석, 원료·연료·첨가제, 부대시설을 묶어 공정을 판정하고, 폐기장 규모에 따라 전수 또는 통계 표본수거를 선택해야 한다. 분석 결과는 부록으로 분리하지 말고 현장 공정 판정, 자원획득, 조재제·조업온도 해석, 보고서 고찰로 되돌려야 한다. |
| 청동생산유적 | 구리광산, 채굴갱, 갱도, 선광장, 배소수혈, 제련로, 용해로, 도가니, 용범, 송풍관, 풀무 주혈, 탄치장, 폐기장, 동재, 청동재, 유리질 슬래그, 도가니편, 용범편, 폐도가니 도로 재사용, 합금명, 납동위원소, 원료 산지, 관영·사찰 공방 | `bronzeProcessStage`, `bronzeFeatureType`, `bronzeMineObservation`, `bronzeMeltingFurnaceType`, `bronzeCrucibleType`, `bronzeResidueType`, `bronzeAlloyTerm`, `bronzeWasteDeposit`, `leadIsotopeAnalysis`, `bronzeSupplyNetwork` | 청동생산유적은 제철과 달리 광산·합금·도가니·용범·납동위원소 분석이 중심축이다. 채광부터 주조까지 공정별 유구를 나누고, 도가니 정치 방식과 송풍 방향, 폐기장 물체질, 도로 보수재 재사용, 국내·중국·일본산 원료 후보를 함께 기록해야 한다. |
| 공방복합유적 | 운영 주체, 공급 대상, 사찰·궁정·관영 관련성, 작업구획, 구획구, 배수구, 테라스, 지붕·주혈, 창고, 저수유구, 집수·침전·수세·방류, 폐기물 블록, 체질망 크기, 수세 포대 수, 생산품·실패품·견본·목간·물품표, 제작 수량, 산지·공납 표기, 상설/임시 성격 | `workshopOperator`, `workshopSupplyTarget`, `workshopUnit`, `workshopWaterSystem`, `workshopWasteBlock`, `sievingMeshSize`, `washedBagCount`, `workshopOutput`, `orderEvidence`, `woodenTabletLink`, `workshopCharacterInterpretation` | 복합 공방은 노와 가마만으로 해석되지 않는다. 물관리와 폐기물 수세가 생산품 회수와 미세유물 수습을 좌우하고, 목간·견본·물품표는 운영 주체와 공급 대상을 보여준다. 해석은 사원공방·관영공방·궁정공방 같은 후보와 근거 묶음으로 남긴다. |
| 토기소성기술 | 소성흔 형태, 소성흔 위치, 개수, 간격, 함몰, 색조, 연소흔·자연유와의 구분, 이상재·이기재 후보, 초본류·모래·할석·내화토·점토·토기편·전용토제품, 고리형·고배대각형·장고형·쐐기형·변형원통형 소성도구, 중첩소성 조합, 도치 여부, 적재 단수 후보 | `potteryFiringTraceType`, `potteryFiringTraceLocation`, `traceCount`, `traceSpacing`, `kilnFurnitureFunction`, `kilnFurnitureMaterial`, `dedicatedKilnFurnitureType`, `stackingCombination`, `invertedFiring`, `stackingLevelInference`, `firingTechnologyInterpretation` | 토기 소성흔은 표면 결함이 아니라 제작 행위의 흔적이다. 이상재·이기재 사용, 중첩소성, 가마 내부 적재 방식, 대량생산 수요, 기술의 시간성을 복원하려면 토기 부위별 흔적과 대응 요도구를 함께 기록해야 한다. |
| 토기가마·요장 | 소성유구/구조요 판정, 요상 경사, 평면형, 소성부/연소부 비율, 지하식·반지하식·지상식 판단, 회청색·담황색·적색 피열색, 화구 폐쇄토, 산화/환원 경계, 보수흔, 선저형 피트, 함몰 벽체편·천장편, 유리질 피막 벽체, 점토 덧바름 벽체, 요상 단·모래·소분·토기편 깔림, 연도 위치와 오벽 형태, 회구부 재층·소결토·점질니토, 채토장, 녹로축혈, 고상식 건물지, 항공촬영, 투시도 산화/환원 표기, AMS·수종·OSL·고고지자기 시료 | `potteryKilnClassification`, `kilnSlope`, `kilnPlanType`, `kilnConstructionType`, `heatedSoilColorSequence`, `fireboxClosure`, `oxidationReductionBoundary`, `kilnRepairTrace`, `kilnWallFragmentType`, `kilnFloorPreparation`, `flueType`, `ashDumpStratigraphy`, `kilnYardFacility`, `kilnPhotoPlan`, `kilnScientificSample` | 토기가마는 요체와 회구부만으로 끝나지 않는다. 구조요인지 소성유구인지 판단 근거를 남기고, 화구·연소부·소성부·연도부·회구부의 미세 관찰을 채토장·작업장·건조장·저장고와 연결해야 한다. 피열색, 함몰 벽체편, 요상하부시설, 회구부 층위, 사진·실측·고고지자기 시료가 생산기술과 조업 횟수, 공급 체계 해석으로 이어진다. |
| 유리생산유적 | 유리구슬 제작기법 후보, 가로줄, 기포 방향, 구멍과 나란한 결, 표면 돌기, 유리 조성계, 유리주조용 진흙틀 평면형·구멍·심재구멍·포목흔·변색, 철침·벼과식물 줄기·심재 후보, 유리도가니 저부형태·뚜껑·주구 없음·태토·유리침전물·균열 누출·긁음흔·재사용층, 소형 노시설, 폐기수혈, 슬래그, 납동위원소·XRF·잔류물 분석, 복원실험 비교, 궁중·관영·사영 공방 후보 | `glassProductionEvidence`, `glassCompositionGroup`, `glassManufacturingTechnique`, `glassClayMoldType`, `moldHolePattern`, `coreMaterial`, `glassCrucibleType`, `crucibleResidueLayer`, `crucibleInstallation`, `glassWorkshopFeature`, `glassResidueAnalysis`, `leadIsotopeForGlass`, `glassReplicationExperiment`, `glassWorkshopOperator` | 유리 생산유적은 완제품만으로 생산을 설명할 수 없다. 진흙틀과 도가니가 같은 공정인지 다른 공정인지, 도가니 침전물이 재사용층인지, 색 변화가 사용흔인지 퇴적 변색인지, 원료가 수입품인지 국내 원료인지 모두 판단 보류값과 분석 계획을 가져야 한다. 제작기법, 조성, 공방 운영 성격은 자연과학 분석과 복원실험 비교로 되돌아가며 갱신되어야 한다. |
| 기와가마·와요 | 지하식·반지하식·지상식 입지, 평요/등요 세부형식, 아궁이 구축재료·단면형태·폐쇄흔·보수흔, 연소실 평면·유단/무단·재층 범위, 소성실 평면·경사도·바닥 정지층·기물 적재흔, 다연도·단연도1·단연도2, 요전부, 회구부 재층·벽체편·제품폐기물, 층위별 기와 문양, 도침용 토기편·기와편, 가마군 장축·동시조업·축조순서, 채토장·수비장·건조장·주거지, C14·고고지자기·OSL·태토분석 | `tileKilnLocationType`, `tileKilnTypology`, `tileKilnFirebox`, `tileKilnCombustionChamber`, `tileKilnFiringChamber`, `tileKilnFlueType`, `tileKilnFrontArea`, `tileKilnWasteDeposit`, `tilePatternByLayer`, `tileSupportSherd`, `tileKilnGroupSequence`, `tileKilnAssociatedFacility`, `tileKilnSample`, `tileFabricAnalysis` | 기와가마는 구조 형식과 기와 편년, 생산지-소비지 해석이 직결된다. 회구부를 해당 가마와 자동 연결하지 말고 토층으로 검증해야 하며, 가마 부위별 수습과 회구부 층위수습, 기와 문양, 태토분석, 고고지자기 시료가 함께 있어야 가마 형식 변화와 공급체계를 설명할 수 있다. |
| 자기요장 | 토취장, 원토보관처, 수비공, 수비찌꺼기 모래층, 태토건조장·온돌, 연토장, 물레구멍, 봇긋·갓모·굽깎기통·도범, 유약제조공·유약저장공·유약통, 요전부, 봉통부, 불턱, 불창기둥, 격벽, 창불구멍·창불마개, 초벌칸, 출입구 방향, 번조실 경사와 칸별 품질, 연도부 배연로·개자리·연통부, 폐기장 층위, 갑발, 도지미, 굽받침, 내저원각, 지명·문헌·민속 단서, 유태분석·수종분석·소비지 비교 | `porcelainKilnSiteElement`, `porcelainClaySource`, `porcelainClayProcessingStage`, `porcelainWorkshopFacility`, `porcelainGlazeFacility`, `porcelainKilnType`, `porcelainFireboxFeature`, `porcelainFiringChamberFeature`, `porcelainFlueFeature`, `porcelainWasteDeposit`, `porcelainKilnTool`, `porcelainFindNaming`, `porcelainFootAttribute`, `porcelainBodyGlazeAnalysis`, `porcelainSupplyNetwork` | 자기요장은 토취-수비-연토-성형-시유-번조-폐기의 연쇄와 소비지 연결이 핵심이다. 가마만 기록하면 공방 전문화, 원료 조달, 품질 차이, 관요·민요 성격, 운송과 소비 수요를 잃는다. 각 유구는 기능을 확정하기 전 원토·태토·유약·자편 분석, 폐기장 층위, 문헌·민속 단서와 함께 판단 보류값을 가져야 한다. |
| 측구부탄요 | 낮은 피열의 소토유구, 백탄요·흑탄요 후보, 구릉 경사면, 등고선 평행 주축, 소성부, 연소부, 분구, 분구폐쇄석, 연도·연통, 전면작업장, 복수 측구, 측구폐쇄석, 측면작업장, 외부·내부 배수구, 주혈, 천정부편 초류·목재흔, 굴지구흔, 피열색, 목탄과 주혈 탄화목, 장축·단축 토층둑, 원색 도면·도판, 현장보존·이전보존 | `charcoalKilnProductionType`, `charcoalKilnStructureType`, `charcoalKilnPart`, `sideOpeningFeature`, `charcoalKilnClosure`, `charcoalKilnDrainage`, `charcoalKilnCeilingTrace`, `charcoalKilnToolTrace`, `heatedColorMapping`, `charcoalSpeciesSample`, `charcoalKilnDatingSample`, `charcoalKilnDrawingSet`, `charcoalKilnPhotoSet`, `charcoalKilnPreservationAction` | 측구부탄요는 유물보다 구조와 색, 목탄 시료가 말한다. 외부배수구를 평면 확인 때 잃지 않고, 측구·폐쇄석을 원위치로 기록하며, 천정부편의 초류·목재흔과 피열색을 도면화해야 지하식/반지하식 판단, 백탄 생산, 제철·분묘·생활 연료와의 관계를 비교할 수 있다. |
| 고고지자기 시료 | 잘 구워진 소성면, 최종소성면 후보, 정방위 시료, 플라스틱큐브, 석고 고정, pitch, dip, strike, 자북 기준 방향, 현재 편각 보정값, 진북 보정, NRM, 교류소자, 최적소자단계, D, I, L95, K, n/N, D.F., 제외 시료, 표준곡선 비교지역, 고고지자기 추정연대 | `archaeomagneticSampleSet`, `archaeomagneticSamplePosition`, `archaeomagneticOrientation`, `magneticNorthCorrection`, `archaeomagneticSamplingQuality`, `archaeomagneticDemagnetization`, `archaeomagneticResultD`, `archaeomagneticResultI`, `archaeomagneticResultL95`, `archaeomagneticResultK`, `archaeomagneticAcceptedSampleRatio`, `archaeomagneticReferenceCurve`, `archaeomagneticEstimatedDate` | 고고지자기는 소토만 있으면 자동으로 되는 연대측정이 아니다. 방향이 살아 있는 시료를 채취하고 자북 보정과 품질값을 남겨야 하며, L95·K·n/N과 표준곡선 지역차를 함께 기록해야 추정연대의 신뢰도를 판단할 수 있다. |
| 연구 질문·해석 | 관찰값, 형식 후보, 편년 후보, 문화유형명, 분류 근거, 대표 속성, 변이, 대안 해석, 제작·사용·폐기 시점, 일괄유물 관계, 해석 상태, 보고서 반영 문단 | `researchQuestion`, `interpretationArgument`, `classificationBasis`, `typologyCandidate`, `chronologyCandidate`, `interpretationStatus`, `alternativeInterpretation`, `useLifePhase`, `reportSectionLink` | 형식명과 시대구분은 원자료가 아니라 해석틀이다. 제9권의 방법론 원칙에 따라 관찰값과 해석값을 분리하고, 형식 확정 전 변이와 대안 해석을 보존해야 한다. |
| 민족지·실험 비교 | 유추 질문, 민족지·민속·문헌·산업사회 관찰 자료, 상사 유형, 비교 변수, 환경·문화·기술·사회조건, 차이점, 자연현상 가능성, 실험 질문, 재료·도구·인력·온도·습도·연료, 반복 횟수, 실패값, 평가 | `ethnoarchaeologyReference`, `analogyType`, `comparisonVariable`, `analogyLimit`, `taphonomicObservation`, `experimentRecord`, `experimentCondition`, `replicationCount`, `failedRun`, `experimentEvaluation` | 비슷한 잔존물이 곧 같은 행위를 뜻하지 않는다. 민족지 유추와 실험은 자연·후퇴적 변형을 걸러낸 뒤, 통제 조건과 실패값까지 남길 때 해석 근거가 된다. |
| 인골·동물유체 | 해부학적 위치, 자세, 방향, 보존 상태, 오염 가능성, 수습 순서, DNA 시료, 노출 도구, 물 사용 여부, 포장재, 건조 기간, 체질 방법, 표본 채취량, 동물 분류 수준, 부위·좌우, 성·연령, 계측, 절단흔·화흔·포식흔·풍화, NISP·MNE·MNI·MAU·%MAU | `anatomicalPosition`, `orientation`, `preservationState`, `collectionOrder`, `dnaSampleStatus`, `sievingMethod`, `sampleVolume`, `zooarchaeologicalTaxon`, `skeletalPart`, `ageSexEstimate`, `boneModification`, `zooarchaeologicalMetric`, `zooarchaeologicalQuantification` | DNA·동물고고학 등 분석은 수습과 보관 단계에서 신뢰도가 갈린다. 작은 동물자료는 전체 체질이나 층위별 표본 채취 없이는 누락되기 쉽고, NISP·MNI 같은 계량값은 산출 방식과 한계를 함께 기록해야 한다. |
| 자연과학 시료 | 분석 목적, 적정 방법, 파괴 여부, 채취 위치, 채취량, 포장, 냉장/냉동, 오염 위험, 시료 대표성, 전처리, Lab No., 측정값, 역년 보정, 결과 채택 여부, 분석자 협업, 결과가 바꾼 해석 | `analysisPurpose`, `methodCandidate`, `samplingContext`, `sampleAmount`, `contaminationRisk`, `storageTemperature`, `sampleRepresentativeness`, `pretreatment`, `labNumber`, `calibratedAge`, `resultStatus`, `analystCollaboration`, `interpretationImpact` | 분석 대상과 목적에 맞는 방법을 고르고, 결과의 한계까지 검토해야 한다. 시료만 보내는 방식이 아니라 어떤 질문을 분석으로 검증하는지, 결과가 유적 해석을 어떻게 바꾸었는지를 남긴다. |
| 유기물·무기물 분석 | 목재·종자·인골·동물뼈·화분·기생충알·식물규산체, 고DNA 오염관리, 토양 LOI·pH·total lipid·sterol, 도·토기·도자기·안료·금속·유리·석재, XRD·XRF·SEM-EDS·ICP-MS·금속현미경·납동위원소, 비파괴/파괴 여부, 산지·제작기술·보존상태 해석 | `organicAnalysisTarget`, `organicAnalysisMethod`, `ancientDnaContaminationControl`, `ancientSoilAnalysis`, `inorganicAnalysisTarget`, `inorganicAnalysisMethod`, `destructiveSamplingDecision`, `materialProvenance`, `technologyInterpretation`, `conservationStateInterpretation` | 유기물과 무기물 분석은 재질군별 질문이 다르다. 유기물은 오염과 보존 조건, 무기물은 분석 방법과 파괴 범위, 원료·산지·제작기술·보존상태 해석을 함께 관리해야 한다. |
| 공개·권리 관리 | 공개 대상, 공개 형식, 공개 등급, 위치정보, 인골, DNA, 도굴 위험 유물, 개인·소유권, 미확정 해석, 사진·영상·3D 사용권, 설명문, 출처 표기, 참여자 수, 후속 교육 | `publicArchaeologyOutput`, `accessControlTag`, `sensitiveInformation`, `mediaRights`, `publicDescription`, `publicAudience`, `publicEventMetric`, `educationFollowUp` | 대중고고학은 보고서 밖에서 유적 자료가 시민에게 전달되는 과정이다. 공개자료는 연구성과를 열되 민감 정보와 권리를 통제해야 하므로, 공개 등급과 설명문 이력을 원기록에 연결한다. |
| 해외조사 리스크 | 현지 법제, 협력기관, 조사허가, 사전 지표조사, 문화재 반출 제한, 보존조치, 현지 인력, 국제공개, 개발 일정 영향, 안전·분쟁 리스크 | `overseasHeritageRisk`, `localHeritageLaw`, `partnerInstitution`, `surveyPermit`, `exportRestriction`, `preservationAction`, `localStaffing`, `internationalDisclosure`, `developmentScheduleRisk` | 해외 개발사업도 문화재 리스크가 사라지지 않는다. 조사사업 단계에서 현지 법과 허가, 보존·공개 의무, 일정 영향을 따로 관리해야 국내 현장기록과 같은 추적성을 확보할 수 있다. |
| 고생물·고환경 시료 | 화분·포자, 규조, 유공충, 패류, 종실류, 식물규산체, 코어 깊이, 퇴적상, 산화·환원 상태, 원지성·이지성, 군집대, 무화석대, 해수면·해안선·식생·기후 해석 | `paleoenvironmentProxy`, `coreDepth`, `sedimentaryFacies`, `redoxCondition`, `taphonomicInterpretation`, `assemblageZone`, `barrenZone`, `paleoenvironmentInterpretation` | 신석기 환경 복원은 패총과 밭, 해안선, 농경 가능성을 설명하는 근거다. 프록시별 보존 조건과 운반·재퇴적 가능성을 기록하지 않으면 분석 결과가 유적 해석으로 돌아오지 못한다. |
| 3D·측량 | 기준점, 좌표계, GNSS/RTK/VRS, 토탈스테이션, 스캔 위치, 타겟, 점밀도, 폐색영역, 중복스캔, 고밀도 보강, 정합, Geo-referencing, 검사측량, 필터링, 정사이미지, 도면, 모델링 파일 | `controlPoint`, `coordinateSystem`, `gnssMethod`, `scanStation`, `targetType`, `pointDensity`, `occlusion`, `registration`, `geoReferencing`, `checkSurvey`, `filteringRecord`, `pointCloudFile`, `orthophotoFile`, `modelFile` | 3D 데이터는 파일 첨부가 아니라 좌표·정확도·후처리 이력이 있는 측량 기록이다. 폐색영역과 정합·검사측량 기록이 있어야 도면·모델이 발굴 근거로 재사용될 수 있다. |
| 보존·응급처치 | 노출 시점, 재질, 매장환경, 습도·온도·산소·빛 변화, 수분 상태, 부식·열화 정도, 금속심 잔존, 자석반응, X-ray·CT 후보, 세척 여부, 주변토 포함 수습, 한지·화선지·킴와이프스 차단층, 압박붕대·석고붕대, 수지 강화, 발포성 우레탄폼, 습윤/건조 보관, 차광, 냉장, 완충지지대, 상하 표시, 안전장비, 전문가 자문, 후속 보존처리 | `exposureDate`, `burialEnvironment`, `postExcavationRisk`, `materialState`, `damage`, `cleaningDecision`, `liftingMethod`, `temporaryConsolidation`, `packing`, `storageCondition`, `safetyMeasure`, `expertConsultation`, `transport` | 노출 직후부터 변질이 시작되므로 수습과 응급처치 자체를 기록해야 한다. 금속, 도토기, 연질토기, 수침목재, 뼈, 의류는 서로 다른 보관 조건을 요구하므로, 일률적인 세척·건조·분리를 피하고 사용 재료와 조치 이유, 가역성, 전문가 판단을 함께 남긴다. |

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

3·5·6권은 이미지 기반 스캔본이라 후속 OCR이 필요하다. 2권 선사 유적은 Windows OCR 전체 판독을 마쳤고, 구석기 형성과정, 패총 층위·체질·수비, 인골·패류·어골·동물자료, 절대연대 시료 항목을 우선 반영했다. 3권 건물지, 5권 고분, 6권 충적지는 일부 OCR 판독을 시작했으며, 특히 다음 항목은 계속 보강한다.

- 제3권: 외국 사례 후반 도면 검토, 조사 중 유구선 수정 이력
- 제5권: 고분 유형별 매장주체부, 외래요소 해석, 인골 분석 결과 정리
- 제6권: 토양조사 장은 맺음말까지 1차 OCR 반영 완료. 필요 시 도표·사례별 지명 색인 정밀화.

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
