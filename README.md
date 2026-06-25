# 현장 기록 📒

한국 고고학 현장에서 태블릿과 데스크톱으로 함께 쓰는 현장 기록 앱입니다. 현장에서는 조사 경계를 잡고, 유구와 트렌치를 추가하고, 사진·스케치·약측·메모를 바로 붙입니다. 사무실에서는 같은 기록을 데스크톱에서 열어 전체 유구 현황, 위치, 사진, 도면, 토층, 유물, 시료, 보완 항목을 정리합니다.

이 앱은 유구 이름만 적는 목록장이 아니라, 현장에서 보고 그린 것과 설명을 함께 남기는 디지털 야장을 목표로 합니다. 처음부터 모든 항목을 채우라고 요구하지 않고, 조사 순서에 맞춰 필요한 기록을 붙인 뒤 나중에 보완할 수 있게 합니다.

원본은 독일고고학연구소(DAI)와 GBV가 개발한 [iDAI.field](https://github.com/dainst/idai-field)입니다. 이 포크는 Apache-2.0 라이선스를 따르며, 한국 조사 현장에 맞는 별도 버전으로 운영합니다.

## 🧱 운영 원칙

이 저장소는 iDAI.field 원본에 병합 요청을 보내는 것을 전제로 하지 않는 독립 포크입니다. 원작자가 이 포크의 변경을 Pull Request로 받을 수 없다고 밝힌 상황을 존중하며, 원본 프로젝트와 원작자에게 리뷰, 병합, 한국형 기능 검토, 사용자 지원 부담을 넘기지 않습니다.

필요한 변경은 이 저장소 안에서 이슈, 브랜치, 커밋, 릴리스로 처리합니다. 원본 프로젝트에는 출처와 라이선스 고지, 공개 문서 링크, 참고한 upstream 변경 기록만 남기며, 사전 합의 없는 PR·멘션·지원 요청은 보내지 않는 것을 이 포크의 운영 헌장으로 삼습니다. 자세한 기준은 [CONTRIBUTING.md](CONTRIBUTING.md)에 둡니다.

## 🌿 출처와 참고

- 원본 저장소: [dainst/idai-field](https://github.com/dainst/idai-field)
- 원본 프로젝트 사이트: [field.idai.world](https://field.idai.world/)
- 원본 문서: [iDAI.field wiki](https://github.com/dainst/idai-field/wiki)
- 라이선스: Apache License 2.0
- 출처 고지: [NOTICE.md](NOTICE.md)
- 참고 논문: S. Hohl, T. Kleinke, F. Riebschläger, J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, *Archeologia e Calcolatori* 34.1, 2023, 85-94. DOI: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10)

관련 문서:

- [현장 적용 연구 노트](docs/korean-fieldwork/README.md)
- [iDAI.field wiki 한국어 번역](docs/wiki/README.md)
- [Hohl et al. 2023 논문 한국어 요약/번역 노트](docs/papers/hohl-et-al-2023-idai-field.ko.md)
- [Android 태블릿 설치 안내](docs/korean-fieldwork/android-tablet-install.ko.md)

## 🧭 어디에 쓰나

현장 기록은 표본조사, 시굴조사, 발굴조사에서 반복되는 기록을 놓치지 않기 위한 도구입니다. 하나의 프로젝트 안에서 조사구역, 트렌치, 유구, 피트, 토층, 사진, 유물, 시료, 실측 자료, 손글씨 메모를 서로 연결해 두면 보고서와 도면 정리 단계에서 원기록을 다시 찾기 쉽습니다.

이 앱은 현장에서 모든 판단을 끝내라고 요구하지 않습니다. 처음에는 위치, 사진, 간단한 메모만 남기고, 조사 중 확인되는 내용에 따라 시대·시기, 유구 성격, 장축 방위, 토층 사진, Munsell(먼셀) 색, 약측값, 유물·시료 번호, 보완 메모를 더해 가는 흐름을 목표로 합니다.

## ✍️ 기록 원칙

좋은 야장은 많이 묻는 야장이 아니라, 현장에서 필요한 순간에 필요한 만큼만 묻는 야장이어야 합니다.

| 원칙 | 설명 |
| --- | --- |
| 순서대로 시작 | 프로젝트를 만들 때 조사 방식과 조사 경계를 먼저 잡고, 그 안에서 트렌치나 유구 기록을 이어갑니다. |
| 작게 기록 | 유구를 추가할 때는 위치, 임시 번호, 사진, 손글씨 메모, 스케치처럼 현장에서 바로 남길 수 있는 것부터 적습니다. |
| 근거를 붙임 | 설명만 쓰지 않고 사진, 도면, 스케치, 약측값, 유물·시료 번호를 같은 유구 기록에 연결합니다. |
| 나중에 보완 | 유구 성격과 시기는 미상·추정으로 둘 수 있고, 조사 중 확인되는 내용에 맞춰 다시 고칠 수 있습니다. |
| 전체를 봄 | 개별 유구만 보지 않고 전체 유구 현황표에서 상태, 근거자료, 보완 항목, 다음 작업을 한 번에 확인합니다. |

## 🏕️ 현장 사용 흐름

새 프로젝트를 만들 때는 먼저 어떤 조사를 하는지와 조사 경계가 어디인지 정합니다. 경계는 태블릿에서 GPS와 지도를 보며 찍거나, 데스크톱에서 SHP/DXF/CSV/GeoJSON 같은 기존 자료를 가져와 정리할 수 있습니다.

| 조사 성격 | 주로 남기는 기록 |
| --- | --- |
| 표본조사 | 조사구역, 트렌치, 토층 정리 여부, 유구 확인 여부, 피트, 사진 |
| 시굴조사 | 조사구역, 트렌치 번호, 기준 토층, 유구 사진, 피트 토층, 트렌치 완료 사진 |
| 발굴조사 | 제토 중 확인된 유구, 조사 전/중/완료 사진, 토층, 유물 수습, 실측, 보완 메모 |

표본조사와 시굴조사는 트렌치 단위로 기록합니다. 트렌치를 판 순서대로 번호를 붙이고, 토층 정리 여부, 유구 확인 여부, 피트 조사 여부, 피트 토층 기록 여부, 정방향·사선·기준 토층·유구 사진을 남깁니다. 현장 전체가 드러난 뒤 번호를 다시 정리해야 하는 경우도 염두에 둡니다.

발굴조사는 유구 단위로 기록합니다. 제토 중 확인된 유구의 위치를 먼저 찍고, 조사 전 사진을 남긴 뒤 조사 중 사진, 토층 사진, 유물 노출 사진, 유물 수습, 완료 사진, 실측 여부를 이어서 기록합니다. 유구 성격을 선택하면 가마의 연소부·연도부·소성부처럼 그 유구에 맞는 세부 항목을 이어서 정리할 수 있습니다. 처음에는 `미상`이나 `추정`으로 두었다가, 조사하면서 유구 성격과 시기를 고쳐 갈 수 있습니다.

## 🗺️ 지도와 GPS

지도 화면에서는 조사구역과 유구 위치를 함께 다룹니다.

- 현재 GPS 위치를 기준으로 조사 경계 초안을 만들고 바로 편집할 수 있습니다.
- 카카오 JavaScript 키를 설정하면 위성지도를 보며 경계 위치를 찍을 수 있습니다.
- 지도에서 유구를 추가하고, 이어서 유구 종류와 조사 상태를 입력할 수 있습니다.
- 장축 방위는 보통 자북 기준으로 `N-E`, `N-W`, `S-E`, `S-W` 방향과 각도값을 함께 남깁니다. 예를 들어 `N-23°-E`는 북쪽에서 동쪽으로 약 23도 기운 방향입니다.
- 조사구역, 트렌치, 유구의 위치 기록은 태블릿과 데스크톱에서 함께 확인합니다.
- 데스크톱에서는 가져온 SHP/DXF/CSV/GeoJSON 경계와 현장 기록을 함께 정리할 수 있습니다.

## 🔐 지도 API와 토큰

지도 키와 토큰은 코드에 직접 넣지 않고 설정이나 로컬 환경변수로 지정합니다. 카카오 지도는 위성지도와 현장 경계 입력에 쓰고, Mapbox 배경지도를 꼭 써야 한다면 아래처럼 로컬 환경변수로만 지정합니다.

```powershell
$env:REACT_APP_MAPBOX_ACCESS_TOKEN = "your-token"
$env:REACT_APP_MAPBOX_STYLE_ID = "user/style-id"
```

카카오 REST API 키, JavaScript 키, 네이티브 앱 키는 쓰임이 다르므로 설정 화면에서 구분해 관리합니다. 토큰과 키는 저장소에 커밋하지 않습니다. 공개 이력에 노출된 값은 지도 서비스 콘솔에서 폐기하고 새로 발급해야 합니다.

## 📱 태블릿과 데스크톱

태블릿에서는 프로젝트 생성, 조사 경계 설정, 조사 방식 선택, 유구·트렌치 추가, 사진 촬영, 토층 사진, 손글씨 메모, 스케치, 약측값, 방위 기록, 오늘 작업 확인, 전체 유구 현황 확인을 빠르게 처리합니다.

데스크톱에서는 태블릿에서 만든 기록을 열어 위치와 경계를 정리하고, 전체 유구 현황표, 기록 작업 패널, 보완 목록, 근거자료 연결, Munsell(먼셀) 후보 검토, SHP/DXF/CSV/GeoJSON 경계 가져오기를 이어서 처리합니다.

APK는 Android용입니다. Galaxy Tab A9에서 설치와 실행을 확인했으며, Android 6.0 이상과 주요 ABI를 대상으로 빌드합니다. iPad/iOS는 별도 배포 체계가 필요합니다.

## ⬇️ 설치하기

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

## 🛠️ 개발 구조

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
