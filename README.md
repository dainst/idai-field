# 디지털 야장

이 저장소는 한국 고고학 현장에서 태블릿과 데스크톱으로 함께 쓰기 위한 디지털 야장입니다. 태블릿에서는 현장에서 바로 위치를 찍고, 사진을 붙이고, 펜으로 메모하고, 유구와 트렌치 기록을 빠르게 남깁니다. 데스크톱에서는 그 기록을 지도, 드론사진, SHP/DXF/GeoJSON, CAD 성과물, 보고서 대장과 맞춰 정리합니다.

원본은 독일고고학연구소(DAI)와 GBV가 개발한 [iDAI.field](https://github.com/dainst/idai-field)입니다. 이 포크는 Apache-2.0 라이선스를 따르며, 원본 프로젝트에 한국어 현장 설정을 맡기지 않고 한국 조사 환경에 맞는 별도 버전으로 운영합니다.

## 출처와 참고

- 원본 저장소: [dainst/idai-field](https://github.com/dainst/idai-field)
- 원본 프로젝트 사이트: [field.idai.world](https://field.idai.world/)
- 원본 문서: [iDAI.field wiki](https://github.com/dainst/idai-field/wiki)
- 라이선스: Apache License 2.0
- 출처 고지: [NOTICE.md](NOTICE.md)
- 참고 논문: S. Hohl, T. Kleinke, F. Riebschläger, J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, *Archeologia e Calcolatori* 34.1, 2023, 85-94. DOI: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10)

관련 정리 문서:

- [현장 적용 연구 노트](docs/korean-fieldwork/README.md)
- [iDAI.field wiki 한국어 번역](docs/wiki/README.md)
- [Hohl et al. 2023 논문 한국어 요약/번역 노트](docs/papers/hohl-et-al-2023-idai-field.ko.md)
- [Android 태블릿 설치 안내](docs/korean-fieldwork/android-tablet-install.ko.md)

## 어디에 쓰나

디지털 야장은 표본조사, 시굴조사, 발굴조사처럼 현장에서 반복되는 기록을 놓치지 않기 위한 도구입니다. 조사구역, 트렌치, 유구, 피트, 토층, 사진, 유물, 시료, 실측 자료를 서로 연결해서 나중에 보고서와 도면 정리 단계에서 원기록을 다시 찾을 수 있게 합니다.

핵심은 현장에서 판단을 끝내는 것이 아니라, 현장에서만 확보할 수 있는 정보를 빠르게 남기는 것입니다. 유구의 성격이나 시기는 조사 중에 바뀔 수 있으므로, 앱은 확정 판정보다 사진, 위치, 토층, 수습 전 상태, 보완 메모를 안정적으로 남기는 데 초점을 둡니다.

## 현장 사용 흐름

처음 프로젝트를 열면 조사 성격에 맞춰 기록 흐름을 잡습니다.

| 조사 성격 | 주로 쓰는 기록 |
| --- | --- |
| 표본조사 | 조사구역, 트렌치, 토층 정리 여부, 유구 확인 여부, 피트, 사진 |
| 시굴조사 | 조사구역, 트렌치 번호, 기준 토층, 유구 사진, 피트 토층, 트렌치 완료 사진 |
| 발굴조사 | 제토 중 확인된 유구, 조사 전/중/완료 사진, 토층, 유물 수습, 실측, 보완 메모 |

표본조사와 시굴조사는 트렌치 단위로 기록합니다. 트렌치를 판 순서대로 번호를 붙이고, 토층 정리 여부, 유구 확인 여부, 피트 조사 여부, 피트 토층 기록 여부, 정방향·사선·기준 토층·유구 사진을 남깁니다. 현장 전체가 드러난 뒤 트렌치 번호를 다시 정리해야 하는 경우를 위해 번호 수정 흐름도 함께 다룹니다.

발굴조사는 유구 단위로 기록합니다. 제토 중 확인된 유구의 위치를 먼저 찍고, 조사 전 사진을 남긴 뒤, 반절 조사나 토층둑 설정, 조사 중 사진, 토층 사진, 유물 노출 사진, 유물 수습, 완료 사진, 실측 여부를 이어서 기록합니다. 필요한 경우 보완 메모를 남겨 보고서 작성 단계에서 다시 확인할 수 있게 합니다.

## 지도와 GPS

지도 화면에서는 조사구역과 유구 위치를 함께 다룹니다.

- 현재 GPS 위치를 기준으로 조사경계 초안을 만들고 바로 편집할 수 있습니다.
- 현 위치에 유구 점을 찍고, 이어서 유구 종류와 조사 상태를 입력할 수 있습니다.
- 조사구역, 트렌치, 유구의 위치 기록은 태블릿과 데스크톱이 같은 geometry 데이터를 사용합니다.
- 데스크톱 개요 지도는 Mapbox 토큰이 없어도 OpenStreetMap 배경으로 열립니다.

Mapbox 배경지도를 꼭 써야 한다면 토큰을 코드에 넣지 말고 로컬 환경변수로만 지정합니다.

```powershell
$env:REACT_APP_MAPBOX_ACCESS_TOKEN = "your-token"
$env:REACT_APP_MAPBOX_STYLE_ID = "user/style-id"
```

토큰은 저장소에 커밋하지 않습니다. GitHub 보안 경고에 나온 기존 토큰은 코드에서 제거했지만, 이미 공개 기록에 노출된 토큰은 Mapbox에서 폐기해야 합니다.

## 태블릿과 데스크톱 호환

태블릿 전용으로만 따로 저장하는 구조를 피하고, 원본 iDAI.field가 쓰는 문서와 geometry 흐름을 유지합니다. 태블릿에서 만든 조사경계와 유구 위치는 데스크톱에서도 같은 프로젝트 데이터로 읽히며, 데스크톱에서 정리한 위치 보정도 같은 기록에 이어집니다.

다만 APK는 Android용입니다. Galaxy Tab A9에서 설치와 실행을 확인했으며, Android 6.0 이상과 주요 ABI를 대상으로 빌드합니다. iPad/iOS는 별도 배포 체계가 필요합니다.

## 설치하기

일반 사용자는 GitHub Releases 또는 Actions 산출물에서 `idai-field-mobile-release.apk`를 내려받아 태블릿에 직접 설치합니다. Google Play 스토어 배포를 전제로 하지 않습니다.

태블릿에서 APK를 열 때 "알 수 없는 앱 설치" 권한을 묻는 경우, APK를 여는 앱에 한해 허용하면 됩니다. 출처가 불분명한 APK는 설치하지 않는 것을 권장합니다.

Windows PC에 태블릿을 USB로 연결해 설치할 수도 있습니다.

```powershell
.\install-idai-field-android-apk.ps1 -ApkPath .\dist\android\idai-field-mobile-release.apk
```

연결된 태블릿이 여러 대라면 기기 번호를 지정합니다.

```powershell
.\install-idai-field-android-apk.ps1 -ApkPath .\dist\android\idai-field-mobile-release.apk -DeviceSerial R83Y70CADYP
```

개발자가 APK를 직접 만들 때는 다음 명령을 사용합니다.

```powershell
.\build-idai-field-android-apk.ps1 -Variant release
```

개발 중 태블릿에 바로 설치하려면 다음 흐름이 편합니다.

```powershell
.\build-idai-field-android-apk.ps1 -Variant debug -Install
.\run-idai-field-tablet-ko.ps1
```

## 개발 구조

이 저장소는 iDAI.field의 monorepo 구조를 유지합니다.

- [desktop](desktop): Angular/Electron 기반 데스크톱 앱
- [mobile](mobile): React Native 기반 모바일/태블릿 앱
- [server](server): 동기화 서버
- [core](core): 공통 TypeScript 모듈과 설정
- [web](web): 웹 관련 코드
- [publication](publication): 공개/출판 플랫폼 관련 코드

처음 개발 환경을 준비할 때는 원본 프로젝트와 마찬가지로 의존성을 설치합니다.

```bash
npm run bootstrap
```

Windows에서 데스크톱 앱을 바로 실행하기 위한 보조 스크립트:

```powershell
.\run-idai-field-ko.ps1
```

## 원본 README

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
