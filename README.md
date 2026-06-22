# Korean Field Notebook

한국 고고학 현장 조사를 위한 디지털 야장 실험 프로젝트입니다. 이 저장소는 독일고고학연구소(DAI)와 GBV가 개발한 [iDAI.field](https://github.com/dainst/idai-field)에서 비롯된 파생 프로젝트이며, 원 프로젝트의 구조를 바탕으로 한국 매장문화재 조사 실정에 맞는 기록 흐름을 구현해 나갑니다.

이 프로젝트는 원본 iDAI.field를 대체하거나 훼손하려는 것이 아니라, 한국 현장에서 필요한 야장 흐름을 독립적으로 실험하기 위한 저장소입니다.

## 출처와 라이선스

- 원 프로젝트: [dainst/idai-field](https://github.com/dainst/idai-field)
- 원 프로젝트 웹사이트: [field.idai.world](https://field.idai.world/)
- 원 프로젝트 문서: [iDAI.field wiki](https://github.com/dainst/idai-field/wiki)
- 라이선스: Apache License 2.0
- 출처 고지: [NOTICE.md](NOTICE.md)

이 저장소는 iDAI.field에서 파생되었습니다. 원 저작권과 Apache-2.0 라이선스 고지는 보존하며, 한국형 야장 기능, 한국어 문서, 한국 고고학 조사방법론 기반 설정과 UX는 이 저장소에서 별도로 발전시킵니다.

관련 논문:

> S. Hohl, T. Kleinke, F. Riebschläger, J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, *Archeologia e Calcolatori* 34.1, 2023, 85-94. DOI: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10)

한국형 적용을 위해 정리한 내부 문서:

- [한국형 야장 적용 연구 노트](docs/korean-fieldwork/README.md)
- [iDAI.field wiki 한국어 번역](docs/wiki/README.md)
- [Hohl et al. 2023 논문 한국어 요약/번역 노트](docs/papers/hohl-et-al-2023-idai-field.ko.md)

## 목표

한국 고고학 현장의 실제 기록 흐름에 맞춰, 태블릿과 데스크톱을 함께 쓰는 야장 플랫폼을 만듭니다.

- 현장에서 유구 후보를 빠르게 그리고 기록하기
- SHP, DXF, GeoJSON 조사 경계와 배경 레이어를 데스크톱에서 정리하기
- 드론사진이나 정사영상을 선택적으로 배경 레이어로 맞추기
- 태블릿 GPS를 정밀 측량값이 아니라 현재 위치 참고점으로 활용하기
- 유구의 시기, 성격, 조사 상태, 공간 기록 출처를 분리해서 남기기
- 사진, 도면, 펜메모, 시료, 유물, 일지를 유구와 연결하기
- 토층 단면 사진 위에 펜으로 번호와 경계선을 표시하고, 각 토층의 색과 순서를 기록하기
- 자동 OCR이나 자동 토색 판정은 원본 기록을 대체하지 않는 보조 기능으로 다루기

## 현재 구현 방향

### 한국형 설정

`KoreanFieldwork` 설정은 한국형 야장 템플릿을 제공합니다. 프로젝트 생성 시 `한국형 야장` 템플릿을 선택하면 한국어를 기본 언어로 쓰고, 한국 현장 조사에 필요한 값목록과 폼을 우선 노출합니다.

주요 기록 단위:

- `Project`, `Operation`, `DailyLog`
- `Survey`, `FeatureGroup`, `Feature`, `FeatureSegment`
- `Layer`
- `Find`, `Sample`
- `Drawing`, `Photo`, `SoilProfilePhoto`, `AerialMapLayer`, `PenMemo`
- `FieldRecordQualityReview`, `SourceEvidenceIndex`, `TermAuthority`, `TermAlias`

### 지도 기반 유구 후보

한국 현장에서는 전면 제토 뒤 서로 다른 시대와 성격의 유구가 한 평면에 노출되는 일이 많습니다. 이 프로젝트는 지도 위에서 대략적인 유구 후보를 그리고, 이후 조사하면서 성격, 시기, 상태, 사진, 펜메모를 붙여 가는 흐름을 우선합니다.

유구 관련 기본 상태:

- 후보
- 조사중
- 확정
- 제외
- 병합
- 분할

공간 기록 출처:

- 태블릿 스케치
- GPS 대략 위치
- SHP import
- DXF import
- 정식 측량
- 최종 CAD

### 드론사진과 배경 레이어

드론사진은 필수가 아닙니다. 조사 경계와 도면만으로 기록할 수도 있고, 현장 여건이 좋을 때 드론사진이나 정사영상을 배경에 맞춰 사용할 수 있습니다.

지원하려는 흐름:

- 데스크톱에서 조사 경계 SHP/DXF/GeoJSON import
- GeoTIFF 또는 world file이 있는 이미지의 자동 georeference
- 좌표가 없는 드론사진의 기준점 수동 정합
- 태블릿에서 드론사진 배경 켜기/끄기
- 드론사진 위에서 그린 유구 후보를 나중에 정식 측량/CAD 성과물로 보정

드론사진은 참고 레이어이며, 유구 geometry를 자동으로 덮어쓰지 않습니다.

### 펜메모와 전사

현장에서는 텍스트 입력보다 펜으로 빠르게 적는 일이 더 자연스러울 수 있습니다. `PenMemo`는 원본 stroke JSON, 미리보기 이미지, 자동 전사문, 검토 전사문을 분리해서 저장합니다.

원칙:

- 원본 손글씨는 항상 보존
- 자동 OCR 결과는 보조 데이터
- 사람이 고친 검토 전사문은 별도 필드
- OCR 실패가 기록 손실로 이어지지 않게 설계

### 토층 사진과 토색 기록

한국 고고학에서 토층은 매우 중요한 현장 기록입니다. 이 프로젝트는 태블릿 카메라로 토층 단면을 가볍게 찍고, 사진 위에 펜으로 `1, 2, 3, 4...` 순서를 적은 뒤 각 번호를 `Layer` 기록과 연결하는 흐름을 준비합니다.

토층 번호 기본 해석:

- `1` = 가장 최근에 쌓인 층
- 숫자가 커질수록 더 먼저 쌓인 층

토색 기록 원칙:

- 상용 토색첩 이미지는 저장소에 포함하지 않음
- Munsell HVC 형식의 문자열 기록을 우선
- 수동 입력값과 사람이 검토한 값은 별도 필드
- ROI와 촬영 조건은 저장하되, 자동 색상 추천은 후속 보조 기능으로 취급

## 개발 구조

이 저장소는 iDAI.field의 monorepo 구조를 유지합니다.

- [Field Desktop](desktop): Angular/Electron 기반 데스크톱 앱
- [Field Mobile](mobile): React Native 기반 모바일/태블릿 앱
- [Field Hub](server): 선택형 동기화 서버
- [Field Core](core): 공통 TypeScript 모듈과 설정
- [iDAI.field Web](web): 웹 공개 플랫폼 기반 코드
- [Field Publication](publication): 공개/출판 플랫폼 기반 코드

처음 개발 환경을 준비할 때는 원 프로젝트와 마찬가지로 의존성을 bootstrap합니다.

```bash
npm run bootstrap
```

현재 Windows 로컬 실행 보조 스크립트는 다음 파일을 참고합니다.

```powershell
.\run-idai-field-ko.ps1
```

## 원본 README

아래에는 파생 출처 확인을 위해 iDAI.field 원본 README의 핵심 내용을 보존합니다.

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
