# 한국형 야장 적용 연구 노트

이 디렉터리는 번역된 iDAI.field를 한국 매장문화재 조사 현장에 맞는 야장/현장기록 도구로 발전시키기 위한 분석 작업 공간이다.

목표는 단순히 UI를 한국어로 바꾸는 것이 아니라, 현장에서 관찰하고 기록해야 할 내용을 한국 고고학 조사 방법론에 맞춰 정리한 뒤 iDAI.field의 데이터 모델과 입력 양식에 접목하는 것이다.

## 현재 작업 단계

1. 공개 자료로 확인 가능한 『한국 매장문화재 조사연구방법론』 시리즈의 권별 범위와 저작권 조건을 정리한다.
2. 각 권에서 현장 기록 원칙, 관찰 단위, 필수 기록 항목, 보고서로 이어지는 증거 흐름을 추출한다.
3. 추출한 원칙을 iDAI.field의 `core`, `library`, `project-specific` 구성 전략으로 매핑한다.
4. 한국 현장 기록용 기본 템플릿과 값 목록 후보를 만든다.
5. 샘플 프로젝트로 실제 입력 흐름을 검증한다.

## 문서

- [자료 목록과 분석 범위](source-inventory.md)
- [보조 자료군 목록과 우선순위](supplemental-source-inventory.md)
- [PDF 판독 상태](pdf-reading-status.md)
- [한국 현장 고고학 독해 종합](korean-fieldwork-synthesis.md)
- [현장기록 원칙 1차 초안](field-recording-principles.md)
- [현장 현상별 관찰·기록 매트릭스](field-observation-matrix.md)
- [한국형 야장 기록 워크플로 초안](field-recording-workflows.md)
- [한국형 야장 구현 요구사항](field-notebook-requirements.md)
- [한국형 공통 기록 모델 v0](korean-core-recording-model.md)
- [iDAI.field 접목 로드맵](idai-adaptation-roadmap.md)
- [Android 태블릿 설치 안내](android-tablet-install.ko.md)

## 권별 분석 노트

- [제1권: 총론과 공통 야장 요구사항](volume-notes/volume-01-general.md)
- [제2권: 선사시대 유적과 환경 기록](volume-notes/volume-02-prehistoric-sites.md)
- [제3권: 건물지 조사 기록](volume-notes/volume-03-building-sites.md)
- [제4권: 생산유적 조사 기록](volume-notes/volume-04-production-sites.md)
- [제5권: 고분 조사 기록](volume-notes/volume-05-tombs.md)
- [제6권: 고지형·충적지 조사 기록](volume-notes/volume-06-alluvial-sites.md)
- [제7권: 성곽 조사 기록](volume-notes/volume-07-fortresses.md)
- [제8권: 신석기시대 유적과 최신 조사기법](volume-notes/volume-08-neolithic-sites.md)
- [제9권: 연구방법론과 과학 분석](volume-notes/volume-09-research-methods.md)
- [2020년: 제철유적 조사·분석 방법론](volume-notes/volume-2020-iron-production.md)
- [현장 강의자료: 조사방법론 보조 독해](volume-notes/field-training-methods.md)
- [고고학사전 용어 표준화 노트](volume-notes/dictionary-terminology.md)

## 문서 서술 기준

권별 노트, 관찰 매트릭스, 기록 모델 문서는 조사자가 현장에서 무엇을 관찰하고 어떤 판단 근거를 남겨야 하는지에 집중한다. `이번 재독해`, `보강 완료` 같은 작업 이력은 [PDF 판독 상태](pdf-reading-status.md)와 [자료 목록과 분석 범위](source-inventory.md)에 둔다.

설계 방향 서술은 남긴다. 다만 개인적 감상이나 독서 소회가 아니라, 자료에서 도출된 한국 현장 기록 요구사항, iDAI.field 입력 화면, 값 목록, 검토 절차의 형태로 쓴다.

## 중요한 전제

『한국 매장문화재 조사연구방법론』 시리즈 일부는 공공누리 제4유형 조건으로 공개되어 있다. 이 저장소에는 원문 PDF를 직접 포함하지 않고, 출처 링크와 해설, 원칙 추출, 기록항목 설계 결과를 남긴다. 사용자가 제공한 PDF는 분석 근거로만 사용하며, GitHub에는 원문 전체를 재게시하지 않는다.
