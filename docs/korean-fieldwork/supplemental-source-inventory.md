# 보조 자료군 목록과 우선순위

이 문서는 사용자가 추가로 제공한 `C:\Users\nuri9\Downloads\고고학사전`과 `C:\Users\nuri9\Downloads\조사방법론` PDF를 한국형 iDAI.field 야장 설계에 반영하기 위한 작업 목록이다.

기존 『한국 매장문화재 조사연구방법론』 10종은 권별 방법론의 1차 근거로 두고, 이 보조 자료군은 다음 역할로 읽는다.

- `조사방법론`: 현장 강의자료이므로 조사 절차, 실무 요령, 실수 방지, 보고서 역산 항목을 찾는다.
- `고고학사전`: 화면명, 값 목록, 유형명, 유구·유물 용어의 표준화 근거로 쓴다.
- 모든 자료는 원문 전체를 저장소에 옮기지 않고, 조사 항목과 iDAI.field 반영 요구사항만 문서화한다.

## 로컬 위치

```text
C:\Users\nuri9\Downloads\고고학사전
C:\Users\nuri9\Downloads\조사방법론
```

`조사방법론` 폴더의 PyMuPDF 추출 텍스트는 임시 폴더에 둔다.

```text
C:\Users\nuri9\AppData\Local\Temp\codex-idai-field-new-pdf-text\methods-all
```

## 읽기 우선순위

1. 현장 공정과 기록 품질: `현장조사_방법과_해석`, `발굴조사_실무`, `발굴조사의_이해`, `매장문화재_조사실무`, `조사요원_기초소양_교육`.
2. 유적 유형별 실무: 수혈건물지, 분묘유구, 기와가마, 고환경분석, 토기 제작, 지표조사, 유물실측.
3. 보고서와 산출물 역산: 발굴보고서 작성법, 조사업무 이해, 유물실측과 전자도면.
4. 용어 표준화: 구석기·신석기·청동기·고분·고분유물·생산유적·성곽·봉수 사전.

## 조사방법론 자료

| 번호 | 자료 | 쪽수 | 텍스트 상태 | 추출 파일 | iDAI.field에서 볼 지점 |
| --- | --- | ---: | --- | --- | --- |
| 1 | 매장문화재_유적조사방법론(1기).pdf | 180 | 직접 추출+OCR 보강 | `method_01_2c6b2eb8.txt` / `method01_ocr_pages029_176.txt` | 1차 반영 완료. 기와가마 조사와 대량 기와 계량, 제철 공정체계·제련/단야 조사·격자수습·부속유구, 횡혈계 분묘 매장과정·봉토/묘도/제사유구 조사 항목 보강 |
| 2 | 매장문화재_유적조사방법론.pdf | 115 | WinRT OCR 보강 | `method_02_7e18a2b9.txt` / `ocr-selected/method02_full_2020_ocr.txt` | 추가 반영 완료. 2020년 유적조사방법론 전체 OCR로 구석기·취락·분묘·경작유적·기와가마 장 구성을 확인하고, 경작유적 입지, 논밭 구분 기준, 관개시설, 시굴 트렌치 방향, 판정근거, 연대·잔존 상태, 논·밭 평면조사 절차, 분석계획 항목을 보강 |
| 3 | 매장문화재_전문교육_고고학연구_입문2013년_2월.pdf | 313 | 직접 추출 | `method_03_d9fffa9b.txt` | 추가 재대조 완료. 층위 편년 우선, 시간양식·경사편년 전제 검증, 유물복합체 순서배열, 생업경제 자료연쇄, 기술·생산 작업연쇄, 고환경 분석질문과 광역비교 범위 항목 보강 |
| 4 | 매장문화재_전문교육_보존과학_연구의_최신_성과와_과제2013년_9월.pdf | 106 | 부분 추출 | `method_04_b526e517.txt` | 추가 재대조 완료. 수침목재·칠기 응급보관, 금속·토도류 분석 의뢰, 인골 DNA 현장관리, 지류·직물 발견환경 유지, 유기물·토양 분석시료에 더해 보존처리 원칙, 표면약제 사용의 C14·후속처리 영향, 지류·직물 환경 적응과 취급 오염 방지 항목 보강 |
| 5 | 매장문화재_조사실무.pdf | 136 | 부분 추출 | `method_05_862bfa34.txt` | 추가 재대조 완료. 개인 야장의 공적 기록화, 제토 작업량, 문화층 상부 퇴적, 미지형·조망, 판단 변경 이력, 퇴적토 논리검토, 단계별 실측, 기록물 영구관리·열람관리 항목 보강 |
| 6 | 매장문화재전문교육_조사기법특강_수혈건물지_조사법2012년_9월.pdf | 227 | 부분 추출 | `method_06_e98a8710.txt` | 추가 재대조 완료. 어깨선·바닥·내부시설·화재·중복 수혈주거지 조사 항목에 더해 2차 평면제토 판단, 과다 트렌치 회피, 단면 보양·촬영 조건, 1차·2차 퇴적층 유물 수습 순서와 보강조사 항목 보강 |
| 7 | 매장문화재전문교육_조사기술특강_기와가마_조사법2011년_9월.pdf | 59 | 직접 추출+이미지 시트 재대조 | `method_07_f4296a1b.txt` / `tilekiln_sheets/*.jpg` | 추가 재대조 완료. 기와가마 조사계획, 제토량·적재장소, Grid와 토층둑, 가마-회구부 연결 조사, 내부토·조업면 구분, 회구부 해석 주의, 가마군 운영관계, 연대·태토분석 시료, 보고서 협업 항목에 더해 요전부 관찰, 연소실·소성실 분리근거, 연도 미확인 보존판단, 연대시료 신뢰도, 소비지 기와와 태토 산지대조, 시대 변천 판단 항목 보강. 실제 구성에는 `tileKilnStructureContext`, `tileKilnExcavationControl`, `tileKilnPartInvestigation`, `tileKilnOperationSequence`, `tileKilnFindContext`, `tileKilnAnalysisPlan`로 반영 완료 |
| 8 | 매장문화재전문교육_조사기술특강_분묘유구_조사법2011년_8월.pdf | 79 | 부분 추출+OCR 보강 | `method_08_5f4e0608.txt` / `method08_horizontal_chamber_ocr_pages023_042.txt` | 추가 반영 완료. 대형봉토분 외부구조, 수혈식석곽묘 조사절차, 봉토·호석·주구·매장시설·도면·사진 검증 항목 보강. 횡구·횡혈식석실분 본문은 WinRT OCR로 유형구분, 묘도·연도, 입구·현문 폐쇄 선후, 현실 벽·천장·관대·시상, 제사·매납, 현장 수습보존 항목 보강 |
| 9 | 매장문화재전문교육_조사기초과정2011년_7월.pdf | 233 | 부분 추출 | `method_09_68307043.txt` | 추가 반영 완료. 지표조사 절차, 현장조사·탐문·후속조치 판단, 도면·사진·유물수습과 보고서 동시 준비 항목 대조 |
| 10 | 매장문화재전문교육_조사기초과정2012년_7월.pdf | 213 | 부분 추출 | `method_10_331d5eb8.txt` | 추가 반영 완료. 2010·2011년판과 겹치는 조사기초 흐름을 대조하고 조사방법 기술, 도면·사진 오류, 원본 백업, 조사자 역할 항목 보강 |
| 11 | 매장문화재전문교육_조사기초과정_2010년_7월.pdf | 355 | 직접 추출 | `method_11_589b07de.txt` | 추가 반영 완료. 지표조사, 층 구분, 생활유적 절차, 생산유적 공정, 유물 수습·정리·보관, 사진·보고서 동시 검수 항목 보강 |
| 12 | 매장문화재전문교육_조사연구특강_유적조사와_고환경분석2011년_10월.pdf | 148 | 부분 추출+OCR 보강 | `method_12_bc8621bf.txt` / `method12_carbonized_grain_ocr_pages047_078.txt` | 추가 반영 완료. 환경고고학, 토양·화분·규조·식물유체, 동물유체, 고지형·생활지형면 분석 항목 보강. 탄화곡물 장은 WinRT OCR로 식물유체 종류, 시료 설계, 표본추출, 물체질·플로테이션, 동정 근거, 식물고고학 분석/해석 구분, 보존 편향, 목탄 질문 분기, 미검출 해석 항목 보강 |
| 13 | 매장문화재조사_기초이론.pdf | 102 | 부분 추출 | `method_13_ce1850e9.txt` | 추가 재대조 완료. 표본조사 적합성, 시굴 보정계수, 지형별 트렌치 설계, 충적지 깊은 트렌치 안전, 정밀발굴 범위 산정, 행위 역순 발굴, 유물·시료 범위 확장 항목 보강 |
| 14 | 매장문화재조사와_첨단과학장비의_활용.pdf | 136 | 직접 재추출 | `direct-recheck/매장문화재조사와_첨단과학장비의_활용_a83a7862.txt` | 추가 재대조 완료. 고지형분석, GIS, DGPS, UAV, LiDAR, 3D 레이저스캔, 사진실측의 원천자료·좌표계·후처리·산출물 품질관리에 더해 항공사진 입체판독, 사진지표·tie point·내외부표정, 지리보정 검수, 시굴 트렌치 설계 환류 항목 보강 |
| 15 | 발굴보고서_작성법_교재.pdf | 213 | 직접 재추출 | `direct-recheck/발굴보고서_작성법_교재_369786f4.txt` | 대조 완료. 글꼴 깨짐이 많고 16번 교재와 같은 계열로 판단하여 16번의 정상 추출 본문으로 교차 확인. 보고서 자체평가·위원회평가 환류, 기획회의, 원색도판 선정, 편집방식, 인쇄·제본 계획 항목을 보강 |
| 16 | 발굴보고서_작성법_교재_(1).pdf | 389 | 부분 추출+재대조 완료 | `method_16_d9362ba7.txt` | 추가 재대조 완료. 보고서 구성·일러두기·초록, 자연·고고환경, 조사범위와 방법, 조사내용, 도면·사진·유물촬영 요구에 더해 보고서 평가 적용성, 자체평가·위원회평가 차이, 유적유형별 비해당 항목, 현장품질 환류, 사진 선별·오류 예방, 고지도 직접성 판단 항목 보강 |
| 17 | 발굴조사_실무.pdf | 205 | 직접 재추출 | `direct-recheck/발굴조사_실무_f0c001e8.txt` | 추가 반영 완료. 보고서 역산, 약식보고 자료, 성곽 기록, 자기요장 조사 항목에 더해 원삼국·삼국시대 주거지 조사계획, 토층둑·촬영·단계도면·유물 3차원 수습 보강 |
| 18 | 발굴조사_업무의_이해_교재.pdf | 264 | WinRT OCR 보강 | `method_18_747b8b14.txt` / `ocr-selected/method18_full_ocr.txt` | 추가 반영 완료. 2017년 계열 교육자료 전체 OCR로 법령·행정실무, 대가 기준, 적격심사, 발굴조사 이론과 실제, 유구 내부층, 층 개념, 고분, 토기, 수혈주거지 장 구성을 확인하고, 부분완료, 보존조치, 보고서 제출, 국가귀속 선별 절차에 더해 발굴허가 구비서류, 허가조건 이행, 변경·기간연장, 전자행정 제출, 보존조치 관리·재평가 항목을 보강 |
| 19 | 발굴조사_업무의_이해_교재_(2).pdf | 292 | OCR 주요 장 보강 | `method_19_8b1f95bf.txt` / `method19_business_pages001_030_ocr.txt` / `method19_excavation_concepts_layers_ocr.txt` / `method19_tombs_pages157_184_ocr.txt` / `method19_pit_dwellings_pages205_258_ocr.txt` / `method19_period_pottery_pages259_292_ocr.txt` | 추가 반영 완료. 2017년판 목차와 발굴조사 개념, 유구 내부층, 층의 개념, 분묘유적, 수혈주거지, 시대별 토기 장을 OCR로 대조. 발굴맥락, 취락공간, 충적지 유구입지, 토층 관찰절차, 표본·시굴에서 정밀발굴로 넘어가는 기록·유물 인계, 봉분 트렌치·성토 세분, 석곽 충전·미장토·내부 수습, 수혈건물지 용어·생애·내부시설·화재중복, 토기 원료·제작생애·공정방향성을 보강했다. 이번 재대조에서 토도자 용어범위, 비짐 기능, 실떼기·회전깎기 판단주의, 자연유·비산·회흔 구분, 생활도자 비교와 생산분업 후보를 추가 |
| 20 | 발굴조사의_이해.pdf | 153 | 부분 추출 | `method_20_3c118db3.txt` | 추가 대조 완료. 현장기록 작성, 제토 야장, 질문형 유구 야장, 다중 도면, 사진 백업, 일지의 증거성 항목에 더해 가마조사법 장의 자기요장 입지·지명 단서, 등고선 트렌치 전략, 봉통부·번조실·연도부 관찰, 폐기장 전량수습, 보고서 분석 연결 항목 보강 |
| 21 | 유물실측의_이해-충청·호남권역2014년_7월.pdf | 55 | 부분 추출 | `method_21_bd6e06a0.txt` | 추가 재대조 완료. 유물실측 원리, 기준선·실측선, 측점 검점·교정이력, 토기 단면·입면·문양·기벽 기록, 선사토기 제작흔, 역사토기 타날·회전흔, 석기 6면 실측 후보 보강 |
| 22 | 유물실측의_이해_-_호서·호남권역(2015년_8월.pdf | 91 | 부분 추출 | `method_22_9c1fb516.txt` | 추가 재대조 완료. 목기·수침목재 수습과 보존 전 기록, 칠기 보존처리 전후 기록 분리, 수종분석 실험야장·삼단면 사진·프레파라트 색인, 습윤 상태 실측, 도구흔·나이테·칠흔·결합구 기록 보강 |
| 23 | 제1회_매장문화재_조사연구원_교육_2006년12월.pdf | 341 | 선택 OCR 보강 | `method_23_760aa6c5.txt` / `ocr-selected/method23_field_survey_pages149_172_205_242_ocr.txt` / `ocr-selected/method23_outdoor_gis_surface_pages173_260_ocr.txt` | 추가 반영 완료. 도면작성법, 야외조사방법[지표조사], 문화재GIS와 유적 입지분석, 문화재 현지 지표조사 장을 OCR로 대조. 도면 기본메타데이터·단계도면·레벨링, 지표조사 범위·하한연대·조사단 전문성, 현지조사일지·지표수습유물·비유적지 자원조사, GIS 예측 현장대조 항목 보강 |
| 24 | 제2회_매장문화재_조사연구원_교육_2007년3월.pdf | 299 | 선택 OCR 보강 | `method_24_5aff65ba.txt` / `ocr-selected/method24_selected_field_digital_p033_150_153_164_207_236_277_299_ocr.txt` | 추가 반영 완료. 조사계획 수립·결과보고, 전자도면 작성법, 구석기유적 조사법, 저습지 조사방법, GPS 측량, GIS DB와 Tablet/GPS 야외조사 시스템을 OCR로 대조. 조사계획 행정흐름, 보존조치·지도위원회, 구석기 입지·채집·꼬리표·시료, 저습지 지형환경분석, 전자도면 원천자료, GPS 품질·NMEA·사진연동, DB 운영위험 항목 보강 |
| 25 | 제5회_매장문화재_조사연구원_교육_2008년8월.pdf | 464 | 직접 추출 | `method_25_21572f09.txt` | 추가 재대조 완료. 보고서 작성, 유적사진 촬영계획·조건, 자연과학 시료, 동물유체 동정·수습보존·분류·계량, 기능퇴적단위, 수로퇴적 동시성, 출토맥락 행위해석 항목 보강 |
| 26 | 조사요원_기초소양_교육.pdf | 342 | 직접 추출+OCR 보강+원문 이미지 대조 | `method_26_428b3ca9.txt` / `method26_drawing_artifacts_ocr.txt` / `method26_artifact_storage/page_309-313,324,333.png` | 추가 반영 완료. 조사보고서 작성법 장에서 자료 생성 시점, 보조원 자료대조, 보고서 기획회의, 도면·사진·원고 교차검토, 번호 변환표, 디지털사진 관리 항목 보강. 도면작성법 OCR로 고지도·지형도·지적원도·항공사진 원천자료, 좌표계 변환, 주변유적분포도/QGIS 조판 항목 보강. 유물 정리·보관 OCR로 수습-응급처치-보존처리-컨디션체크-국가귀속-이관, 재질별 수장환경과 수장고 동선 항목 보강. 이번 원문 이미지 대조에서 건/점/실수량/부속구 수량 산정 예시와 수장공간 재질별 온습도·오염물 기준을 교정 |
| 27 | 지표조사_업무_이해_교재.pdf | 73 | OCR 재대조 완료 | `method_27_4e58ee02.txt` | 추가 재대조 완료. 28번 자료와 같은 2017년 지표조사 업무 이해 계열로 보조 확인자료 사용. 현장 순수관찰과 사후 문헌대조, 표본조사 판단의 한계, 전역조사 원칙, 조사단 전문성, 후속조치 판단 근거를 대조 |
| 28 | 지표조사_업무의_이해_교재.pdf | 84 | 부분 추출+재대조 완료 | `method_28_7b5882df.txt` | 추가 재대조 완료. 사전조사, 현장관찰, 지도요건, 탐문, 입지패턴, 후속조치 판단에 더해 문헌현장대조, 관찰편향방지, 행정제출패키지, 보존조치이행, 종합의견근거, 기존·신규 구분, 표본조사판단 항목 보강 |
| 29 | 토기_제작의_이해와_실습.pdf | 168 | 직접 재추출 | `direct-recheck/토기_제작의_이해와_실습_e7badfd8.txt` | 추가 재대조 완료. 태토·수비·성형·정면·시문·건조·소성·보수 공정, 중첩소성·요도구·접지흔·용착흔, 토기요장 운영 규모와 시설 배치, 제작실습 변수와 분류판단근거 보강 |
| 30 | 현장조사_방법과_해석.pdf | 147 | 직접 추출+OCR 보강 | `method_30_96b66a06.txt` / `method30_pitdwelling_rotated_ocr.txt` | 추가 반영 완료. 구석기 그리드·지층조사와 기록 품질 보강. 수혈주거지 장은 회전 이미지 OCR로 평면확인-토층둑-1~3차 노출-외부시설조사 연속촬영, 토층둑 설정·분층기록, 유구·유물 사진각도, 마무리조사와 자연과학 시료, 중복주거지 조사순서 항목 보강 |
| 31 | 형식학적_연구의_이해2015년_9월.pdf | 59 | 직접 추출 | `method_31_d8f913a5.txt` | 추가 재대조 완료. 속성·형식·기종·양식 구분, 표지유물과 편년 적용의 검증상태, 공반·순서배열, 형식학 검증흐름과 잔존·혼입 위험 보강 |

조사방법론 강의자료의 공통 반영점은 유적 유형별 화면보다 먼저 적용한다. 작업일지는 조사단 공정 기록으로 매일 작성하고, 날씨·조사자·인부·장비·중요 출토·방문자·변경 사유를 사실 중심으로 남긴다. 개인 야장은 `개인야장공적기록화`로 제출·검토·열람 상태를 관리하고, `기록생성시점관리`로 현장시에만 가능한 기록과 보고서 단계 생성 기록을 구분한다. 층 경계, 유구 윤곽, 수습 전 상태, 사진 각도, 시료 위치처럼 사후복구가 어려운 값은 `현장시점누락점검`으로 별도 표시한다. 현장기록 품질검수는 원자료 안의 메모로 덮어쓰지 않고 `검수대상기록`, `품질검수단계`, `수정보완근거`를 가진 독립 카드로 분리한다. 작업일의 측량·사진·도면·안전·민원·유물정리·시료·일지·보고서 담당과 검토자는 `작업역할책임`으로 구조화해 역할 공백이 일지 문장 속에 묻히지 않게 한다. 작업일지의 당일 사실기록, 누적 조사원·인부·장비 수, 날씨·우천작업, 학술위원회·전문가 검토회의, 발주처·기관 소통, 분쟁 증거 가능성은 `일지증거역할`로 분리한다. 원고·도면·사진·목록·기준토층·번호 변환표는 `보고서편집교차검토`로 묶고, 보고서에 들어가지 않은 원도면·원사진·전자야장 원자료도 `디지털원자료보존`으로 백업·열람 절차를 남긴다. 보고서 자체평가·위원회평가의 차이, 비해당 항목, 적용 제외 근거, 반복 보완요구는 `보고서평가환류`로 따로 남겨 점수표가 현장 품질을 대신하지 않게 한다. 조사 의뢰, 허가, 착수, 변경·기간연장, 완료신고, 보존조치, 후속기관 인계는 조사사업 단위의 업무 상태로 추적한다. 지표조사는 유물산포 확인이 아니라 현장관찰, 관찰편향 방지, 후속조치 판단근거로 관리하고, GIS·항공사진 예측지도는 현장 확인·누락·과대예측·시굴 추천 상태로 다시 검증한다. 표본·시굴 전환은 제한 조사로 후속 발굴을 판단할 수 있는지, 트렌치 방향과 간격이 지형을 제대로 가로지르는지, 정밀발굴 범위와 난이도 산정 근거가 남았는지 Survey 단계에서 관리한다. 수혈건물지·수혈주거지는 유형명 확정보다 어깨선, 둑 설정, 단면 보양, 바닥면, 내부시설, 화재 증거, 중복 선후관계의 현장 증거를 먼저 남긴다. 시료는 분석 목적만이 아니라 채취 즉시성, 빛·수분·오염 통제, 위치도면 연결을 함께 남긴다. 사전 용어는 관계 유형만이 아니라 검색어 매핑, 전문사전 근거, 일반사전 용례, 사전 분야, 적용범위, 출처 우선순위, OCR 교정 필요, 원PDF 대조 완료, 값목록 후보, UI 노출 보류를 함께 표시한다. 이 공통 축은 1차로 `KoreanFieldwork-recordCreationTiming`, `KoreanFieldwork-verificationState`, `KoreanFieldwork-fieldRecordQuality`, `KoreanFieldwork-operationRoleResponsibility`, `KoreanFieldwork-fieldOnlyMissingCheck`, `KoreanFieldwork-personalNotebookArchive`, `KoreanFieldwork-dailyLogContent`, `KoreanFieldwork-dailyLogEvidenceRole`, `KoreanFieldwork-dailyLogReview`, `KoreanFieldwork-digitalSourcePreservation`, `KoreanFieldwork-investigationAdministration`, `KoreanFieldwork-permitConditionCompliance`, `KoreanFieldwork-preservationActionTracking`, `KoreanFieldwork-investigationRecordHandover`, `KoreanFieldwork-reviewedRecordUnit`, `KoreanFieldwork-qualityReviewStage`, `KoreanFieldwork-qualityCorrectionBasis`, `KoreanFieldwork-termRelation`, `KoreanFieldwork-termSearchMapping`, `KoreanFieldwork-termAuthorityStatus`, `KoreanFieldwork-termDictionaryDomain`, `KoreanFieldwork-termApplicationScope`, `KoreanFieldwork-termSourcePriority`, `KoreanFieldwork-surfaceSurveyObservation`, `KoreanFieldwork-surfaceSurveyBiasControl`, `KoreanFieldwork-surfaceSurveyFollowUp`, `KoreanFieldwork-sampleSurveySuitability`, `KoreanFieldwork-trialExcavationPurpose`, `KoreanFieldwork-trialTrenchDesign`, `KoreanFieldwork-excavationScopeDifficultyBasis`, `KoreanFieldwork-gisPredictionEvidence`, `KoreanFieldwork-gisPredictionFieldVerification`, `KoreanFieldwork-pitDwellingExposureBaulk`, `KoreanFieldwork-pitDwellingFloorFacility`, `KoreanFieldwork-pitDwellingFireEvidence`, `KoreanFieldwork-pitDwellingOverlapSequence`, `KoreanFieldwork-featurePackage`, `KoreanFieldwork-samplePurpose`, `KoreanFieldwork-sampleCollectionHandling`, `KoreanFieldwork-archaeobotanySampleDesign`, `KoreanFieldwork-plantRemainSamplingMethod`, `KoreanFieldwork-flotationProcessingRecord`, `KoreanFieldwork-plantRemainIdentificationRecord`, `KoreanFieldwork-archaeobotanyInterpretationReview`, `KoreanFieldwork-plantRemainNonDetectionAssessment`, `KoreanFieldwork-reportCrossCheck`, `KoreanFieldwork-reportEvaluationFeedback` 값 목록에 옮겼다.

2026-06-19 추가 재독해에서는 직접 추출이 약한 `발굴조사_업무의_이해_교재`, `제2회_매장문화재_조사연구원_교육_2007년3월`, `매장문화재_유적조사방법론` OCR 보강본과 `현장조사_방법과_해석` 본문을 대조해, 구획·둑 설정, 배수·집수정, 장비 제토 두께, 기준단면 당일 기록, 안전휀스, 철수 전 기록물 점검을 `KoreanFieldwork-excavationControlSafety`로 추가했다. 이 값은 유구 유형별 둑 계획을 대신하지 않고, 하루 작업 단위에서 현장 운영과 안전·보고서 역산 근거를 함께 검수하기 위한 공통 축이다.

같은 재독해에서 작업일의 현장 보호·보안은 `KoreanFieldwork-siteProtectionSecurity`로 분리했다. 허가서 현장 비치, 착수신고 안내, 보안, 지역주민·파출소·면사무소 통보, 유적보호 주의사항, 출입·경계 통제, 기상 대비, 야간방범, 임시유물·기록물 보관, 미작성자료 즉시 조치, 복사본·자료 인수인계 준비는 `Project`의 허가조건·보존조치 결정값이 아니라 `Operation`의 당일 실행 확인값으로 둔다.

제9권 연구방법론의 국내 조사 제도 비판은 `KoreanFieldwork-koreanArchaeologyInstitutionalRisk`로 `Project` 화면에 배치했다. 개발 절차화, 구제발굴 일정 압박, 경쟁입찰, 전문성 약화, 지도위원회 폐지 영향, 학술발굴 부재, 과학분석 배제, 보고서 품질 위험, 발굴·연구 단절, 기관 역할 불명확은 추상 의견이 아니라 조사자료 수집·분석·해석·공개 사슬을 끊는 사업 조건으로 기록한다.

유물 정리·보관 장의 공통 축은 `KoreanFieldwork-artifactHandlingWorkflow`, `KoreanFieldwork-artifactQuantityBasis`, `KoreanFieldwork-storageEnvironmentControl`로 `Find` 화면에 배치해 현장수습부터 이관까지의 절차, 건·점수 산정 근거, 재질별 수장환경을 같은 유물 카드에서 추적한다.

보존과학 연구 성과 자료의 공통 축은 `KoreanFieldwork-conservationScienceRequest`, `KoreanFieldwork-waterloggedWoodEmergencyStorage`, `KoreanFieldwork-lacquerConservationRisk`, `KoreanFieldwork-metalAnalysisRequest`, `KoreanFieldwork-ceramicConservationState`, `KoreanFieldwork-paperTextileEmergencyRecovery`, `KoreanFieldwork-conservationTreatmentPrincipleReview`, `KoreanFieldwork-humanDnaFieldControl`, `KoreanFieldwork-organicSoilAnalysisSample`, `KoreanFieldwork-destructiveAnalysisDecision`로 `Find`와 `Sample` 화면에 나누어 배치했다. 보존과학은 실내 후처리가 아니라 노출·수습·임시보관·분석승인 단계에서 해석 가능성을 바꾸므로, 유물 카드와 시료 카드가 서로 끊기지 않게 관리한다. 지류·직물은 발견환경 유지, 공기·빛·습도 변화, 취급 오염을 먼저 보고, 보존처리 원칙은 원형·증거·가역성 훼손 여부를 별도 검토값으로 남긴다.

유물실측 2014·2015년 교재의 공통 축은 `KoreanFieldwork-artifactDrawingRecordMethod`, `KoreanFieldwork-artifactDrawingPlan`, `KoreanFieldwork-artifactDrawingQualityCheck`, `KoreanFieldwork-potteryDrawingStandard`, `KoreanFieldwork-stoneToolDrawingView`, `KoreanFieldwork-waterloggedWoodDrawingHandling`로 `Drawing` 화면에 배치했다. 실측은 사진이나 도면 파일의 품질검수가 아니라 기준선·실측선 선택, 측점 검점, 재질별 취급 조건, 보존처리 전후 대조를 포함한 별도 기록 행위로 관리한다.

제철유적 장과 생산유적 사전에서 뽑은 공통 축은 `KoreanFieldwork-ironProcessEvidence`, `KoreanFieldwork-ironFurnaceStructure`, `KoreanFieldwork-ironResidueSubtype`, `KoreanFieldwork-ironSampleAnalysisPlan`로 나누어 배치한다. 제련·단야·용해·초강 판정은 노 이름이 아니라 구조, 부산물, 시료 분석계획, 분석 후 환류가 모여야 확정되도록 한다.

고분·분묘 자료에서 뽑은 공통 축은 `KoreanFieldwork-tombMoundInvestigation`, `KoreanFieldwork-tombBurialStructureInvestigation`, `KoreanFieldwork-graveGoodsRitualContext`, `KoreanFieldwork-humanRemainsRecoveryAnalysis`로 나누어 배치한다. 봉토분·분구묘·주구묘·석곽묘·석실묘 같은 명칭은 결과값으로 남기되, 현장 화면에서는 구지표, 성토 단위, 주구 퇴적과 재굴착, 묘광 어깨선, 관·곽·실 구분, 개석과 폐쇄시설, 추가장·도굴 근거, 부장품 위치 맥락, 인골 오염 방지와 분석 기준이 먼저 기록되도록 한다.

패총·신석기·고환경 자료에서 뽑은 공통 축은 `KoreanFieldwork-shellMiddenStratigraphy`, `KoreanFieldwork-shellMiddenSettlementContext`, `KoreanFieldwork-neolithicSubsistenceEvidence`, `KoreanFieldwork-shellMiddenSamplingStrategy`, `KoreanFieldwork-paleoenvironmentProxySampling`로 나누어 배치한다. 패총명은 결과값으로 두되, 현장 화면에서는 순패층·혼토패층·파쇄패층, 재퇴적과 교란, 평면·단면 병행, 하부·관입 유구, 주거지·노지·저장공·매장·의례·밭 후보, 어구와 해양포유류, 물체질·부유선별, 화분·규조·식물규산체, 연대 전처리와 지역 해수면 곡선 연결이 먼저 기록되도록 한다.

식물유체·탄화곡물 자료에서 뽑은 공통 축은 `KoreanFieldwork-archaeobotanySampleDesign`, `KoreanFieldwork-plantRemainSamplingMethod`, `KoreanFieldwork-flotationProcessingRecord`, `KoreanFieldwork-plantRemainIdentificationRecord`, `KoreanFieldwork-archaeobotanyInterpretationReview`, `KoreanFieldwork-plantRemainNonDetectionAssessment`로 `Sample` 화면에 배치한다. 채취량보다 연구질문과 표본추출 방식, 물체질·플로테이션 처리 조건, 현생 비교표본과 동정 신뢰도, 분석 결과와 문화역사 해석의 분리, 미검출을 부재로 단정하지 않는 조건을 먼저 남긴다.

청동기시대편 증보판에서 뽑은 공통 축은 `KoreanFieldwork-bronzeAgeDwellingEvidence`, `KoreanFieldwork-dolmenStructureContext`, `KoreanFieldwork-bronzeAgeEnclosureInterpretation`, `KoreanFieldwork-bronzeAgePotteryTerminology`로 나누어 배치한다. 송국리식·가락동식·검단리식 같은 주거유형명은 결과값으로 두되, 현장 화면에서는 평면형, 화덕, 중앙 타원형 구덩이, 양단 주혈, 벽도랑, 주거군·묘역 관계와 연대 근거가 먼저 기록되도록 한다. 고인돌·지석묘는 덮개돌·받침돌·묘역시설·무덤방·성혈·이전복원 이력을 분리하고, 환호는 방어·경계·배수·의례 후보와 퇴적·재굴착·수축흔을 분리한다.

충적지·토양도 자료에서 뽑은 공통 축은 `KoreanFieldwork-alluvialLandformSurvey`, `KoreanFieldwork-soilMapPredictionVerification`, `KoreanFieldwork-alluvialLayerConceptAudit`, `KoreanFieldwork-alluvialSurfaceAttribution`, `KoreanFieldwork-alluvialFormationProcess`로 나누어 배치한다. 지표조사 단계에서는 자연제방, 배후습지, 구하도, 미고지, 구해안선, 근현대 형질변경, 보링·주상도, 시굴 대상 제안을 남기고, 정밀토양도는 토양통·대토양군·지도 축척·반영깊이 한계와 실제 시굴·발굴 결과를 함께 검증한다. 층 세부단위에서는 a+b층 세트, 토양층위와 퇴적층위, 구지표면·생활면·유구축조면·검출면, 암색대, 이질토 블록, 라미나, 홍수퇴적을 분리해 같은 검출면을 같은 시기로 오해하지 않게 한다.

저습지 조사방법에서 뽑은 공통 축은 `KoreanFieldwork-wetlandAnalysisSource`, `KoreanFieldwork-wetlandLandformInterpretation`, `KoreanFieldwork-wetlandSurveyTargeting`, `KoreanFieldwork-wetlandMicrotopographyRecord`로 나누어 배치한다. 지표조사 단계에서는 항공사진·고지도·전자지도·지질도·형질변경 지도·보링자료와 판독 단계를 남기고, 시굴 계획에서는 고하천·자연제방·단구면·배후습지 표시와 시굴 지점·범위 설정을 남긴다. 층 세부단위에서는 1회성 퇴적, 수전 매몰토층, 화분·식물규산체·규조 분석, 목제품·종자·동물유체 맥락을 따로 기록해 지표 판독과 발굴 확인값을 섞지 않게 한다.

도면작성법에서 뽑은 공통 축은 `KoreanFieldwork-mapSourceMaterial`, `KoreanFieldwork-historicalMapLandscapeInterpretation`, `KoreanFieldwork-spatialDrawingProductionWorkflow`, `KoreanFieldwork-distributionMapRequirement`로 `Drawing` 화면에 배치한다. 고지도·지형도·지적원도·항공사진·DEM은 완성 도면의 배경이 아니라 조사 전 지형 이해와 유적분포 가능성 판단의 근거이므로, 제작연도·축척·좌표계·출처와 함께 저장한다. 주변유적분포도는 조사대상지역, 문화재·보호구역, 반경, 범례·축척·방위표, PDF와 이미지 산출물까지 남겨 도면 작성 과정을 검증할 수 있게 한다.

GPS·GIS 현장 시스템에서 뽑은 공통 축은 `KoreanFieldwork-gpsSurveyQualityRecord`, `KoreanFieldwork-gpsNmeaRecord`, `KoreanFieldwork-gpsPhotoLinkRecord`, `KoreanFieldwork-fieldDatabaseOperationRisk`로 `Operation`과 `Photo` 화면에 나누어 배치한다. 측량 세션은 GPS/GNSS/RTK, 기준국·이동국, 관측시간, 원시데이터, 좌표계, 지오이드, 위성수와 DOP·정확도를 남기고, NMEA 세부값은 일자·시각·위경도·고도·상태값과 위성별 정보를 분리한다. 사진은 궤적·현재위치·파일명·자동분류 연결을 남기고, 현장 DB는 SHP·DXF, 레이어·도형·속성 편집, 동기화 위험을 별도 운영값으로 남긴다.

전자도면·3D 스캔에서 뽑은 공통 축은 `KoreanFieldwork-electronicDrawingSourceWorkflow`, `KoreanFieldwork-artifactElectronicDrawingProcedure`로 `Drawing` 화면에 배치한다. 유구·현장 전자도면은 스캐너 선정, 점군 획득·병합, 폴리곤 변환·최적화, CAD·2D·3D·복원 산출물과 원본·후처리 파일 보존을 한 흐름으로 남긴다. 유물 전자도면은 형태 검토, 최종 결과물, 특징 view, 단면 위치, 벡터화, 연구자 요구정보, 기준면, 좌표계 이동, 합치 기준을 분리해 실측 판단의 근거를 보존한다.

동물유체·화석환경 자료에서 뽑은 공통 축은 `KoreanFieldwork-faunalRecoverySampling`, `KoreanFieldwork-faunalPreservationHandling`, `KoreanFieldwork-zooarchaeologicalIdentification`, `KoreanFieldwork-boneSurfaceModification`, `KoreanFieldwork-zooarchaeologicalQuantification`으로 `Sample` 화면에 배치한다. 수습 단계에서는 보존 환경, 전체 체질 여부, 체눈, 블록샘플 치수, 동일층 반복 채취와 선별 수습 사유를 남기고, 보존·취급 단계에서는 토양 지지 형태, 탈수·이물질 제거, 전문가 수습과 유구·층별 분리 보관을 남긴다. 동정과 해석 단계에서는 동물종, 부위, 좌우, 성장단계, 동정 불확실성, 뼈 표면 변형, NISP·MNE·MNI·MAU·%MAU의 사용 목적과 한계를 함께 기록한다.

## 고고학사전 자료

| 자료 | 쪽수 | 텍스트 상태 | 추출 파일 | iDAI.field에서 볼 지점 |
| --- | ---: | --- | --- | --- |
| 2001, 한국고고학사전1.pdf | 855 | 직접 추출 | `고고학사전_2001_1_77b5c3cb.txt` | 일반 고고학 용어, 유구·유물 명칭 대조. 일러두기 표기 원칙을 재대조해 한글·한자·원어 병기, 유적명 정규화, 복합 유적 처리, 단위 출력 규칙, 한글색인과 한자/원어색인의 검색 관계를 보강. 집자리/주거지, 조개더미/패총, 고인돌/지석묘, 일반 토기명, 가마터/요지 같은 관용어·전문어 매핑 후보를 추가. 공백·일부 글자 무너짐이 있어 권위값 확정 전 원문대조필요 |
| 2001, 한국고고학사전2.pdf | 598 | 직접 추출 | `고고학사전_2001_2_f8e6dbf9.txt` | 일반 고고학 용어, 값 목록 동의어 대조. 1권과 같은 표기 원칙을 교차 확인해 최신 행정지명·옛 지명 관용명, 동일지점/다른지점 유적명 분리 기준을 보강. 돌널/석관, 독널/옹관, 돌덧널/석곽, 돌방/석실, 움무덤/토광묘, 장천리식 복합유구처럼 분묘·복합유구·생산유구 용어 매핑 후보를 추가. 공백·일부 글자 무너짐이 있어 권위값 확정 전 원문대조필요 |
| 2007, 한국성곽 용어사전.pdf | 397 | 부분 추출+OCR 재대조 | `고고학사전_2007_2f3c1981.txt` | 성곽 개설·시설 정의 대조용. 추출 품질이 낮아 최종 권위값은 2011년 성곽·봉수편과 조사방법론 제7권으로 대조하되, 원문/OCR 재대조로 성문 역할·형식과 구성부재, 오성지·누조·누혈·장군목·장군석 같은 화공대응·폐쇄 시설, 암문 기능, 여장 부재, 수문·수구·은구 구분, 해자·황·성황, 왜성 해자 기능, 왜성 곡륜 배치·호구 유형·건물/방어시설, 봉수 운영어, 각자성석 관계 보강 |
| 국립문화유산연구원, 2009, 한국고고학전문사전 고분편 | 1498 | 직접 추출 | `고고학사전_2009_671e8ef7.txt` | 추가 재대조 완료. 분구·봉토·주구·묘광·매장주체부, 묘도·연도·폐쇄석, 다곽식·다중 매장주체, 제사장 위치 항목 보강 |
| 국립문화유산연구원, 2011, 한국고고학전문사전 성곽·봉수편 | 1702 | 부분 추출 | `고고학사전_2011_9fed557e.txt` | 추가 재대조 완료. 성곽 시설 관계, 성문 방어시설, 수리·배수시설, 봉수 물리시설·노선·운영주체, 산성·봉수 복합관계 보강 |
| 국립문화유산연구원, 2012, 한국고고학전문사전 신석기시대편 | 671 | 직접 추출 | `고고학사전_2012_3b459e83.txt` | 추가 재대조 완료. 패총의 층위·재점유·후대교란, 결합식조침·작살·어망추 등 복합 어구, 고산리식·융기문·압인문·이중구연 등 토기 편년 표지와 관찰값 분리 원칙 보강 |
| 국립문화유산연구원, 2013, 한국고고학전문사전 구석기시대편 | 454 | 직접 추출 | `고고학사전_2013_3b6b052d.txt` | 추가 재대조 완료. 격지·몸돌·제작기법·문화층·토양쐐기에 더해 석재 표준명·산지근거, 사용흔, 접합·되맞추기, 석기군 공간관계, 르발루아·아슐리안·무스테리안 등 국외 용어 관계 보강 |
| 국립문화유산연구원, 2015, 한국고고학전문사전 고분유물편 | 1010 | 부분 추출 | `고고학사전_2015_ed1168b3.txt` | 추가 재대조 완료. 부장품 위치·기능, 장신구 부품, 마구 기능부위, 무기 위세·실용 기능 등 보강 |
| 국립문화유산연구원, 2019, 한국고고학전문사전 생산유적편 | 1619 | 부분 추출 | `고고학사전_2019_fa84a720.txt` | 추가 재대조 완료. 노·가마·공방·부산물·생산공정 용어, 분야 색인과 찾아가기 관계에 더해 개념/유적/유물 표제어 구분, 동일 유적 내 생산분야별 분리, 보고서명·사업명 찾아가기, 원고 흐름, 단위·띄어쓰기·도자 한자 표기 규칙, 공방 부속시설, 요도구 소성흔, 가마/요/요지 정규화, 노/로 공정후보 분리, 제철 부산물 세부 값과 공정 판정주의 보강 |
| 국립문화유산연구원, 2022, 한국고고학전문사전 청동기시대편 증보판 1 | 1006 | 부분 추출 | `고고학사전_2022_1_da599e20.txt` | 추가 재대조 완료. 국내편 표제어·찾아가기 관계를 대조하고 송국리식 집자리, 가락동식/둔산식, 고인돌/지석묘, 환호, 민무늬/무문토기 이칭·관찰값 분리 원칙 보강 |
| 국립문화유산연구원, 2022, 한국고고학전문사전 청동기시대편 증보판 2 | 770 | 부분 추출 | `고고학사전_2022_2_09df21aa.txt` | 추가 재대조 완료. 국내편 고인돌 묘역시설·무덤방, 환호의 기능·퇴적·수축흔, 검단리식·송국리식 등 주거유형 관계와 토기 명칭 관계 보강 |
| 국립문화유산연구원, 2022, 한국고고학전문사전 청동기시대편 증보판 3 | 570 | 부분 추출 | `고고학사전_2022_3_fef85036.txt` | 추가 재대조 완료. 국외편 표기 원칙, 원문·행정단위 병기, 국외 표제어 찾아가기, 비파형 동모·세형동검 등 붙임/띄어쓰기 적용 예외를 국내 권위어 체계와 연결 |

1차 점검에서는 [고고학사전 용어 표준화 노트](volume-notes/dictionary-terminology.md)를 만들었다. 2001년 일반 사전은 공백과 일부 글자가 많이 무너져 넓은 용례 확인용으로 먼저 쓰되, 이번 재대조에서 `일반사전표기원칙`, `유적명정규화관계`, `유적복합성처리`, `사전설명문단위규칙`, `사전색인관계`, `일반사전주거용어매핑`, `일반사전분묘용어매핑`, `일반사전패총용어매핑`, `일반사전토기용어매핑`, `일반사전생산용어매핑`, `일반사전복합유구매핑`을 보강했다. 전문사전류는 `TermAuthority`, `TermAlias`, `TermRelationship`, `TermImportMapping`, `sourceDictionary`, `verificationState`를 가진 표준 용어 체계의 근거로 쓴다. 이번 구현에서는 `TermAuthority` 1차 카드와 사전 분야, 적용범위, 출처 우선순위 값목록을 추가해 표제어 후보를 값목록으로 바로 확정하지 않고 검증 상태와 함께 관리하게 했다. 생산유적편과 청동기시대편은 `용어관계종류`, `생산유적분야표지`, `용어측정단위적용`, `표제어표기원칙`, `찾아가기관계`까지 반영했다. 고분편과 고분유물편은 `분묘용어관계`, `고분유물위치관계`, `고분장구부속구`로 관·곽·실, 매장방식, 부장품 위치를 분리했고, 성곽 용어는 `성곽용어관계`, `성문방어시설관계`, `성문유형용어`, `해자성황용어관계`, `왜성해자구분`, `왜성곡륜배치`, `왜성호구유형`, `왜성건물방어시설`, `봉수운영용어`로 성벽·기초·문지·방어시설·수리시설·봉수 운영어를 나누어 보도록 정리했다. 신석기시대편은 패총 문화층·복합 어구·토기 편년 표지, 청동기시대편 증보판은 주거유형·고인돌 구조·환호 기능·표제어 이칭 관계를 추가로 보강했다. 실제 값 목록 변환은 생산유적, 청동기 주거·무덤, 구석기 석기, 성곽·봉수, 고분·고분유물처럼 템플릿 구현 순서에 맞추어 부분 적용한다.

2001년 일반 사전은 추가 재대조에서 `일반사전유적명분기`, `일반사전주거세부관계`, `일반사전패총층관계`, `일반사전고인돌부가흔`, `일반사전분묘전환관계`를 보강했다. 이 항목들은 생활어를 표준어로 강제 치환하기 위한 목록이 아니라, 현장 검색어·보고서 관용어·구조 세부값·판단 보류값을 분리하기 위한 입력 매핑 근거로 둔다.

2026-06-19 감사에서 `고고학사전` PDF 12개와 추출 텍스트 12개, `조사방법론` PDF 31개와 `methods-all` 추출 텍스트 31개의 대응을 다시 확인했다. 일부 강의자료는 기본 `metadata.tsv`의 직접 추출문이 0자이므로 `direct-recheck`와 `ocr-selected` 보강본을 실질 근거로 삼아야 한다. 독해 작업의 다음 단계는 새 목록화가 아니라 OCR 취약 구간의 원문 이미지 교정과 실제 iDAI.field 템플릿 적용 검증이다. 이번 템플릿 검증에서는 성곽 성문·수문·왜성 해자 값 목록이 유구군이 아니라 개별 유구 `Feature` 화면에 붙어야 함을 확인했다. 이어 조사방법론의 경작유구 장과 제6권 충적지·제8권 문암리 밭유구 노트를 대조해 `cultivationFeatureContext`, `cultivationTrialTrenchStrategy`, `cultivationFeatureEvidence`, `cultivationChronologyAnalysis`를 개별 유구 `Feature` 화면에 배치했다.

## 비판적 독해 기준

- 강의자료의 “현장 팁”은 그대로 UI 강제값으로 만들지 않는다. 먼저 반복되는 위험, 누락되면 복구 불가능한 정보, 보고서 산출물과 직접 연결되는 항목인지 따진다.
- 사전류 용어는 표준값 후보로 쓰되, 현장 기관별 관용어와 보고서 용어가 다를 수 있으므로 동의어·폐기어·대안어 필드를 둔다.
- 이미지 기반 PDF에서 추출된 텍스트는 원문 대조 전까지 `OCR 교정 필요` 상태로 둔다.
- 도표·사진·표·캡션·사례명·한자·수치처럼 원문 대조가 필요한 근거는 `SourceEvidenceIndex`에 원문 자료 종류, 적용 영역, 대조 상태, 사용 목적을 남긴 뒤 값목록이나 템플릿으로 승격한다.
- 조사자가 빠르게 입력해야 하는 현장 화면에는 필수값만 두고, 분석·보고서 역산 항목은 후속 정리 화면으로 분리한다.
