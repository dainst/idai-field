# Korean Field Notebook 🧭

한국 고고학 현장의 기록 흐름에 맞춰 iDAI.field를 개조해 가는 디지털 야장 포크입니다. 목표는 태블릿에서 빠르게 그리고, 찍고, 적은 현장 기록을 데스크톱에서 조사 경계, 드론사진, SHP/DXF/GeoJSON, CAD 성과물과 맞춰 정리하는 것입니다.

이 저장소는 독일고고학연구소(DAI)와 GBV가 개발한 [iDAI.field](https://github.com/dainst/idai-field)에서 비롯되었습니다. 원본 프로젝트와 Apache-2.0 라이선스 고지를 존중하며, 한국 매장문화재 조사 실정에 맞춘 설정, 문서, 모바일 입력 흐름, 데스크톱 검토 흐름을 이 포크에서 별도로 발전시킵니다.

## 🌱 출처와 참고

- 원본 저장소: [dainst/idai-field](https://github.com/dainst/idai-field)
- 원본 프로젝트 사이트: [field.idai.world](https://field.idai.world/)
- 원본 문서: [iDAI.field wiki](https://github.com/dainst/idai-field/wiki)
- 라이선스: Apache License 2.0
- 출처 고지: [NOTICE.md](NOTICE.md)
- 참고 논문: S. Hohl, T. Kleinke, F. Riebschläger, J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, *Archeologia e Calcolatori* 34.1, 2023, 85-94. DOI: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10)

한국형 개조를 위해 정리한 문서:

- [한국형 현장 적용 연구 노트](docs/korean-fieldwork/README.md)
- [iDAI.field wiki 한국어 번역](docs/wiki/README.md)
- [Hohl et al. 2023 논문 한국어 요약/번역 노트](docs/papers/hohl-et-al-2023-idai-field.ko.md)

## ✨ 한눈에 보기

| 흐름 | 현재 방향 |
| --- | --- |
| 🗺️ 조사경계 | 선형 경계로 기록하고 SHP/DXF/GeoJSON, 기준지도, GPS 참고점을 함께 사용 |
| 🏺 유구 후보 | 태블릿에서 빠르게 만들고 사진, 토층, 유물, 시료, 펜메모를 계속 연결 |
| 🛰️ 드론 배경 | 선택 기능으로 두되, 제토 중 갱신되는 배경 레이어와 유구선 보정 이력을 보존 |
| 🧱 토층 기록 | 단면 사진 위 번호·펜표시를 `Layer` 기록과 연결하고 토색은 수동 기록 우선 |
| ✍️ 펜메모 | 원본 stroke와 전사문을 분리 보존해 검색·정리용 데이터로 활용 |
| 🖥️ 데스크톱 검토 | 현장 기록을 SHP/DXF/CAD, 보고서 대장, 증거 묶음과 맞춰 점검 |

## 🎯 목표

한국 현장에서는 제토와 조사가 동시에 진행되고, 유구가 노출되는 순간의 사진, 대략 위치, 토층, 유물 수습 전 상태, 실측 여부가 뒤늦게 복구하기 어렵습니다. 이 프로젝트는 그 흐름을 다음처럼 잡습니다.

1. 조사경계를 선형 기록으로 만들거나 가져옵니다.
2. 배경지도, 드론사진, SHP/DXF/GeoJSON 레이어를 참고합니다.
3. 태블릿 지도 위에 유구 후보를 빠르게 그립니다.
4. 유구를 클릭해 조사 전, 조사 중, 토층, 실측, 유물 수습, 완료 상태를 확인합니다.
5. 사진, 토층사진, 펜메모, 유물, 시료, 도면을 유구에 계속 붙입니다.
6. 데스크톱에서 드론사진, 정식 측량, CAD, 보고서 자료와 맞춰 geometry와 증거 연결을 검토합니다.

## 🧩 현재 구현된 방향

### 🇰🇷 한국형 설정

`KoreanFieldwork` 설정과 `한국형 야장` 시작 템플릿을 제공합니다. 프로젝트 생성 시 한국어를 기본 언어로 쓰고, 현장 기록에 필요한 범주와 값목록을 우선 노출합니다.

주요 기록 단위:

- `Project`, `Operation`, `DailyLog`
- `Survey`, `SurveyBoundary`
- `FeatureGroup`, `Feature`, `FeatureSegment`
- `Layer`
- `Find`, `Sample`
- `Photo`, `SoilProfilePhoto`, `Drawing`, `AerialMapLayer`, `PenMemo`
- `FieldRecordQualityReview`, `SourceEvidenceIndex`, `TermAuthority`, `TermAlias`

### 🗺️ 조사경계와 지도 기록

조사경계는 채워진 면이 아니라 `SurveyBoundary`의 `LineString` 또는 `MultiLineString`으로 기록합니다. 경계의 출처는 수동 추적, GPS 답사, CSV/SHP/DXF/GeoJSON import, 정식 측량, 최종 CAD로 구분합니다.

Google Maps, OpenStreetMap, 사용자 WMTS/TMS 같은 온라인 기준지도는 선택 참고 배경으로만 사용합니다. API 키나 서비스 접근 정보는 야장 데이터가 아니라 로컬 앱 설정에 두는 것을 원칙으로 합니다.

### 🏺 유구 후보와 조사 체크리스트

모바일 지도에서 유구 후보를 만들면 기본적으로 `Feature` 문서가 생성됩니다. 처음에는 대략적인 점이나 스케치일 수 있지만, 유구의 설명, 성격, 시기, 사진, 토층, 유물, 시료 연결은 같은 문서에 계속 누적합니다.

유구를 선택하면 조사 흐름을 체크합니다.

- 조사 전 사진
- 조사 중 사진
- 토층사진
- 실측
- 수습 전 유물사진
- 유물 수습
- 시료 채취
- 완료 사진

저장을 막기보다는 “현장 종료 전 확인” 배지로 빠진 항목을 알려줍니다. 예를 들어 완료된 유구에 완료 사진이 없거나, 유물 수습 체크가 있는데 수습 전 사진이 없거나, 시료에 분석 목적이 없으면 경고로 남깁니다.

### 🛰️ 드론사진과 갱신되는 배경 레이어

드론사진은 필수가 아닙니다. 조사 경계와 도면만으로 기록할 수도 있고, 현장 여건이 좋을 때 드론사진이나 정사영상을 배경 레이어로 맞춰 사용할 수 있습니다.

제토와 조사가 동시에 진행되는 현장을 전제로, 드론사진 레이어는 한 번만 넣는 배경이 아니라 반복 갱신될 수 있게 설계합니다.

- 초기 참고
- 제토 중 갱신
- 일일 드론 갱신
- 노출 후 갱신
- 최종 참고

각 드론 레이어는 버전 묶음, 버전 번호, 이전 레이어 ID를 가질 수 있습니다. 처음 대략 그린 유구는 같은 `Feature` 문서를 유지하고, 새 드론 배경에서 보이는 유구선에 맞춰 geometry만 보정합니다. `featureGeometryRevisionHistory`에 보정 전후의 geometry, 출처, 신뢰도, 참조 레이어를 남겨서 유구 정보와 선 보정 이력이 끊기지 않게 합니다.

### 🧱 토층 사진과 토색 기록

토층은 `Layer` 기록으로 정리하고, `SoilProfilePhoto`를 통해 태블릿에서 찍은 단면 사진과 펜 표시를 연결합니다. 사진 위에 `1, 2, 3, 4...` 번호와 경계선을 표시하고, 각 번호를 실제 토층 기록과 연결하는 흐름을 준비합니다.

토층 번호 기본 해석:

- `1` = 가장 최근에 쌓인 층
- 숫자가 커질수록 더 먼저 쌓인 층

토색은 자동 판정보다 수동 기록을 우선합니다. 상용 토색첩 이미지는 저장소에 포함하지 않고, Munsell HVC 문자열, 습윤 상태, 촬영 조건, ROI, 색상 메모를 남깁니다. 자동 토색 추천은 원본 사진과 수동 기록이 안정적으로 남은 뒤 붙이는 보조 기능으로 둡니다.

### ✍️ 펜메모와 전사

현장에서 텍스트 입력이 어려울 수 있으므로 `PenMemo`를 별도 기록 단위로 둡니다. 원본 stroke JSON, 미리보기 이미지, 자동 전사문, 검토 전사문, 전사 상태를 분리해 저장합니다.

원칙:

- 손글씨 원본은 항상 보존
- OCR 결과는 검색과 정리를 돕는 보조 데이터
- 자동 전사문은 사람이 고친 검토 전사문을 덮어쓰지 않음
- OCR 실패가 기록 손실로 이어지지 않음

### 🖥️ 데스크톱 검토

데스크톱은 현장 입력기를 대체하지 않고, 현장 기록을 정리하고 보고서로 이어지는 증거 사슬을 확인하는 쪽에 둡니다.

준비 중인 검토 흐름:

- 유구별 사진, 도면, 토층사진, 펜메모, 유물, 시료 연결 확인
- 태블릿 스케치 geometry와 드론사진, SHP/DXF/CAD 성과물 비교
- 유구선 보정 이력 보존
- 보고서 사진대장, 도면목록, 유물목록, 시료목록으로 이어지는 원기록 ID 점검
- `TermAuthority`와 `TermAlias`를 이용한 권위어/현장어 분리

## 🛠️ 개발 구조

이 저장소는 iDAI.field의 monorepo 구조를 유지합니다.

- [desktop](desktop): Angular/Electron 기반 데스크톱 앱
- [mobile](mobile): React Native 기반 모바일/태블릿 앱
- [server](server): 동기화 서버
- [core](core): 공통 TypeScript 모듈과 설정
- [web](web): 웹 관련 코드
- [publication](publication): 공개/출판 플랫폼 관련 코드

처음 개발 환경을 준비할 때는 원본 프로젝트와 마찬가지로 의존성을 bootstrap합니다.

```bash
npm run bootstrap
```

Windows에서 한국형 야장을 바로 실행하기 위한 보조 스크립트:

```powershell
.\run-idai-field-ko.ps1
```

## 📜 원본 README

아래에는 출처 확인을 위해 iDAI.field 원본 README의 핵심 내용을 접어 보존합니다.

<details>
<summary>Original iDAI.field README excerpt</summary>

# iDAI.field | Field

Field is a modern take on flexible field and find recording for archaeological excavations. It is developed as a cooperation between the German Archaeological Institute ([DAI](https://www.dainst.org)) and the Head Office of the GBV Common Library Network ([GBV](https://en.gbv.de/)). Field is completely Open Source and free to use.

## About Field

For an overview of the genesis and the idea behind Field, see:

S. Hohl - T. Kleinke - F. Riebschläger - J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, AeC 34, 1, 2023, 85-94, doi: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10).

Using Field, archaeologists can:

- record, share and store all data and images produced on the excavation
- customize their own data model on top of a minimal shared model as defined by Field
- locate all of their records on a map
- manage types and inventories
- sync and publish their excavation data

## Information for users and interested projects

The original project invites users to join the [Field users mailing list](https://lists.fu-berlin.de/listinfo/idaifield2-user) and the [GitHub Discussions](https://github.com/dainst/idai-field/discussions).

## Development

The original repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependencies.

```bash
npm run bootstrap
```

</details>
