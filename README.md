# iDAI.field | Field <a href='https://field.idai.world/'><img src='/desktop/img/logo.png' align="right" height="200" /></a>

<!-- badges: start -->
[![latest release](https://img.shields.io/github/v/release/dainst/idai-field)](https://github.com/dainst/releases)
[![Manual](https://img.shields.io/badge/Manual-field.idai.world-green)](https://field.idai.world/manual)
<!-- badges: end -->

Field는 고고학 발굴 현장의 야장, 유물 기록, 이미지, 지도, 동기화 작업을 유연하게 처리하기 위한 오픈소스 기록 도구입니다. 독일고고학연구소([DAI](https://www.dainst.org))와 GBV 공동도서관 네트워크 본부([GBV](https://en.gbv.de/))가 협력해 개발하고 있으며, 누구나 무료로 사용할 수 있습니다.

## Field 소개

Field의 배경과 설계 의도는 다음 논문에서 자세히 확인할 수 있습니다.

S. Hohl - T. Kleinke - F. Riebschlager - J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, AeC 34, 1, 2023, 85-94, doi: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10).

Field를 사용하면 고고학 연구자는 다음 작업을 할 수 있습니다.

* 발굴 현장에서 생산되는 데이터와 이미지를 기록, 공유, 보관
* Field가 제공하는 최소 공통 모델 위에 프로젝트별 데이터 모델 구성
* 기록 자료를 지도 위에 배치하고 공간적으로 관리
* 형식 자료와 수장/보관 정보를 관리
* 발굴 데이터를 동기화하고 공개

## 사용자와 관심 프로젝트를 위한 안내

Field를 실제 조사와 연구에 적용하는 사례를 언제나 환영합니다. 연구에 Field를 사용한다면 [Field 사용자 메일링 리스트](https://lists.fu-berlin.de/listinfo/idaifield2-user)([idaifield2-user@dainst.de](mailto:idaifield2-user@dainst.de))에 가입해 다른 사용자와 팁을 공유하고 새 릴리스 소식을 받을 수 있습니다. 이 저장소의 [Discussions](https://github.com/dainst/idai-field/discussions)에도 자유롭게 참여할 수 있습니다.

## 개발자와 기여자를 위한 안내

이 저장소는 여섯 패키지로 구성된 모노레포입니다.

* [Field Desktop](desktop): Angular와 Electron 기반 데스크톱 애플리케이션
* [Field Mobile](mobile): React Native 기반 모바일 애플리케이션(초기 개발 단계, 아직 릴리스 없음)
* [Field Hub](server): 선택적으로 사용할 수 있는 동기화 서버 애플리케이션
* [Field Core](core): 공통 TypeScript 모듈
* [iDAI.field Web](web): [iDAI.field Web 공개 플랫폼](https://field.idai.world)
* [Field Publication](publication): 새 Field 공개 플랫폼(개발 중, 아직 릴리스 없음)

## 사용법

자세한 사용법은 [한국어 Wiki 번역](docs/wiki/README.md)과 데스크톱 앱의 한국어 도움말을 참고하세요. 원문 Wiki는 비교를 위해 [docs/wiki/original](docs/wiki/original/)에 보관했습니다.

## 개발

이 저장소는 하위 패키지 의존성 관리를 위해 [lerna](https://github.com/lerna/lerna)를 사용합니다. 처음 코드를 받은 뒤에는 다음 명령으로 의존성을 준비합니다.

    $ npm run bootstrap

개별 개발 환경 설정은 각 하위 패키지의 README를 참고하세요.

<details>
<summary>Original README (English)</summary>

# iDAI.field | Field <a href='https://field.idai.world/'><img src='/desktop/img/logo.png' align="right" height="200" /></a>

<!-- badges: start -->
[![latest release](https://img.shields.io/github/v/release/dainst/idai-field)](https://github.com/dainst/releases)
[![Manual](https://img.shields.io/badge/Manual-field.idai.world-green)](https://field.idai.world/manual)
<!-- badges: end -->

Field is a modern take on flexible field and find recording for archaeological excavations. It is developed as a cooperation between the German Archaeological Institute ([DAI](https://www.dainst.org)) and the Head Office of the GBV Common Library Network ([GBV](https://en.gbv.de/)). Field is completely Open Source and free to use!

## About Field

For an overview of the genesis and the idea behind Field, check out one of our latest articles:

S. Hohl - T. Kleinke - F. Riebschlager - J. Watson, **iDAI.field: developing software for the documentation of archaeological fieldwork**, AeC 34, 1, 2023, 85-94, doi: [10.19282/ac.34.1.2023.10](https://doi.org/10.19282/ac.34.1.2023.10).

Using Field, archaeologists can:

* record, share and store all data and images produced on the excavation
* customize their own data model on top of a minimal shared model as defined by Field
* locate all of their records on a map
* manage types and inventories
* sync & publish their excavation data

## Information for users and interested projects
We are always happy to hear about your Field projects! If you are using Field in your research, consider [signing up for the Field users mailing list](https://lists.fu-berlin.de/listinfo/idaifield2-user) ([idaifield2-user@dainst.de](mailto:idaifield2-user@dainst.de)), where you can exchange tips and tricks with other users and get updates about new releases. Feel free to also join in the [Discussions](https://github.com/dainst/idai-field/discussions) in this repository.

## Information for developers and collaborators

This is a monorepo containing six packages:

* [Field Desktop](desktop): The Field Desktop application based on Angular and Electron
* [Field Mobile](mobile): The Field Mobile application based on React Native (early development, no release yet)
* [Field Hub](server): The (optional) synchronisation server application.
* [Field Core](core): Shared TypeScript modules
* [iDAI.field Web](web): The [iDAI.field Web publication platform](https://field.idai.world)
* [Field Publication](publication): The new Field publication platform (in development, no release yet)

## Usage

Please refer to the [wiki](https://github.com/dainst/idai-field/wiki).

## Development

The repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependecies.
When first checking out the code base, bootstrap the dependencies with:

    $ npm run bootstrap

Refer to the sub-package READMEs for detailed instructions on how to set up individual
development environments.

</details>
