Field Desktop은 현재 개발팀에서 영어와 독일어로 제공됩니다. 다른 모든 언어에 대한 번역은 커뮤니티에서 관리합니다. 이 페이지에서는 애플리케이션(사용자 인터페이스 및 구성)을 새로운 언어로 번역하거나 이미 사용 가능한 언어 중 하나에 대한 번역 작업에 참여하는 이유와 방법을 설명합니다.
## 목적
Field Desktop은 데이터 수집을 위한 기본 데스크탑(**MacOS**, **Windows** 및 **Linux**) 애플리케이션입니다. 모든 새 버전 릴리스에서는 사용자 인터페이스를 즉시 번역해야 합니다. 따라서 지역사회가 참여할 수 있도록 구조화된 프로세스가 필요합니다. 개인이나 단체가 참여를 원하는 경우 다음 단계를 수행해야 합니다.
## 번역 관리
번역은 [Weblate](https://docs.weblate.org/de/weblate-4.17/index.html)로 관리됩니다. 통계와 같은 특정 기능에 대한 질문이 있는 경우 설명서를 참조하세요. 이 위키는 Field Desktop과 그 구성 요소의 실제 번역에 중점을 두고 있습니다. DAI는 [공개적으로 표시되는 Weblate 프로젝트](https://weblate.dainst.org/projects/field-desktop/)에서 Field Desktop의 번역을 관리합니다. 프로젝트를 클릭하면 번역 상태를 시각적으로 표현하는 많은 구성 요소가 표시됩니다.
![Field Desktop Weblate project](https://github.com/dainst/idai-field/assets/29372760/45f70d63-51d9-4210-a77f-ed61c4154876)
설명서(아래 참조) 이외의 모든 구성 요소가 여기에 나열되어 있습니다.
**소프트웨어 구성 요소:**
* [애플리케이션 초기화](https://weblate.dainst.org/projects/field-desktop/application-initialization/)
* [애플리케이션 창](https://weblate.dainst.org/projects/field-desktop/application-window/)
* [사용자 인터페이스](https://weblate.dainst.org/projects/field-desktop/user-interface/)
**구성 관련 구성 요소:**
* [구성(코어)](https://weblate.dainst.org/projects/field-desktop/configuration-core/)
* [구성(라이브러리)](https://weblate.dainst.org/projects/field-desktop/configuration-library/)
* [구성 템플릿](https://weblate.dainst.org/projects/field-desktop/configuration-templates/)
* [기본 값 목록](https://weblate.dainst.org/projects/field-desktop/default-valuelists/)
추가적으로 [샘플 데이터](https://weblate.dainst.org/projects/field-desktop/sample-data/)도 번역될 수 있습니다.
[용어집](https://weblate.dainst.org/projects/field-desktop/glossary/)을 사용하여 구성 요소 간 번역의 일관성을 보장할 수 있습니다.
## 참여 방법
### 1. Weblate에 가입
특정 언어로 번역할 권리를 얻으려면 등록이 필요합니다. 등록 과정에 대해 궁금한 점이 있으면 언제든지 개발팀에 문의하세요. 하지만 여기서는 특별한 일이 없습니다.
![image](https://github.com/dainst/idai-field/assets/29372760/a9b944b4-ebe0-4763-a8fd-69aa04e41d93)
등록이 성공적으로 완료되면 확인 링크가 전송됩니다. 링크를 따라 등록을 확인하고 계정에 로그인하세요.
### 2. 번역하려는 언어에 대한 이슈를 만듭니다.
다음으로 [Field Desktop 저장소](https://github.com/dainst/idai-field)에 이슈를 생성합니다. 귀하의 Weblate 사용자 이름과 번역하려는 언어를 알려주십시오. 스크린샷을 참조하십시오. 아래와 같이 '번역' 라벨을 사용하세요.
![image](https://github.com/dainst/idai-field/assets/29372760/f6aeb537-364f-4cbd-8d3c-c45154f02e53)
귀하가 시작할 수 있도록 관리자 중 한 명이 귀하를 그룹에 최대한 빨리 추가할 것입니다.
해당 언어의 관리자가 되고 싶다면 이슈에서도 이를 언급하세요. 관리자는 번역을 검토할 수 있으며 Field Desktop의 새 버전이 출시되면 응답할 책임이 있습니다.
### 3. 번역하세요!
Field Desktop 프로젝트에서 프로젝트 감시를 활성화합니다(프로젝트 > 모든 프로젝트 찾아보기 > Field Desktop 선택 > 프로젝트 감시 Field Desktop 선택).
번역할 언어를 선택하고(두 개 이상인 경우) 시작할 옵션을 선택하세요. 탐색 옵션에는 모두 아이콘 위로 마우스를 가져가면 나타나는 설명 팝업 텍스트가 있습니다.
![image](https://github.com/dainst/idai-field/assets/29372760/9cad8d6b-d9bc-4c7c-8d0f-4113b4d89fb1)
"문자열 상태"에서 완료되지 않은 문자열과 편집 표시된 문자열을 볼 수 있습니다. "완료되지 않은 문자열"을 클릭하면 이 특정 언어에 대해 번역이 필요한 모든 문자열이 표시됩니다. "찾아보기"를 클릭하면 문자열을 살펴볼 수 있고, "번역"을 클릭하면 번역 모드로 전환되고 "Zen"은 zen 모드로 변경됩니다. Zen 모드에서는 페이지를 전환하지 않고도 스크롤할 수 있는 하나의 단일 목록에 표시될 모든 항목을 볼 수 있습니다. 이 모드는 번역에도 유용합니다(아래 참조).
애플리케이션의 가장 중요한 구성 요소는 _사용자 인터페이스_, _애플리케이션 창_ 및 _애플리케이션 초기화_입니다. _Core Configuration_도 번역되어야 하지만 모든 버전에서 증가하지는 않습니다.
응용프로그램 창에 새로운 용어가 추가되면 상단에 표시됩니다. "번역"을 클릭하면 모든 용어가 새 창에 나타납니다.
![image](https://github.com/dainst/idai-field/assets/29372760/8512d5f3-90ed-4547-9348-ff1bdf331b99)
#### 번역 중 탐색 옵션
페이지 상단의 옵션에는 이 섹션의 1/50 문자열이 표시되며(스크린샷 참조), 그 외에 처음, 뒤로, 다음 문자열 또는 마지막 문자열로 이동하는 옵션도 있습니다. 페이지 상단의 기본 탐색 옵션 옆에는 검색창이 있습니다. 여기에 검색할 단어를 입력할 수 있습니다. 검색은 번역, 키 및 번역된 언어 내에서 수행됩니다. 여기에는 다양한 필터 옵션도 있습니다. g. string:needs-editing은 "수정 필요"로 표시된 모든 문자열을 표시합니다. 검색 결과가 표시되며 탐색할 수 있습니다. 사용 가능한 결과가 없으면 문자열을 찾을 수 없다는 메시지가 나타납니다.
![image](https://github.com/dainst/idai-field/assets/29372760/7dbee389-80a9-46cc-8fe7-ddf5fdd9ac4c)
번역 창(이 항목에 대한 고유 링크를 생성하는 오른쪽 상단 옵션 참고)에서 예제의 첫 번째 부분(스크린샷 참조)에는 오른쪽 상단에 표시되는 키의 독일어 번역이 표시됩니다. 독일어 텍스트 옆에는 문자열을 클립보드에 복사하는 버튼이 있고 바로 옆에는 문자열을 번역(예제에서는 영어)에 복제하는 버튼이 있습니다.
![image](https://github.com/dainst/idai-field/assets/29372760/1fcefbe6-e96f-4adb-a5d1-2681d6210b6f)
번역 중인 언어의 번역 바로 아래에 표시되며, 각 번역은 "수정 필요"로 표시될 수 있습니다. 원래(독일어) 문자열이 변경되거나 수동으로 플래그가 지정된 경우 편집이 필요한 것으로 자동으로 플래그가 지정됩니다.
![image](https://github.com/dainst/idai-field/assets/29372760/a6204504-238c-4eb0-ac35-cc51b8c82e2a)
번역 바로 위에 옵션이 표시되어 다양한 문자와 제어 기호를 번역에 직접 추가할 수 있습니다.
Below the strings, you have the option to skip the string or to save the translation and continue.
#### 용어집 사용
Weblate [용어집](https://docs.weblate.org/en/latest/user/glossary.html)은 모든 번역에 걸쳐 한 언어 내의 어휘를 관리하고 제어하는 ​​데 유용합니다. 번역 전반에 걸쳐 일관성을 높이도록 설계되었습니다. 사용 가능한 용어를 중앙에서 관리하여 애플리케이션 전반에 걸쳐 일관성을 보장할 수도 있습니다. 용어집 용어는 일반 문자열과 동일한 방식으로 번역됩니다.
용어집에 액세스하려면 하단 옵션 "용어집"을 클릭하세요. 이 매뉴얼이 작성되는 시점에서 용어집에는 색상과 프로젝트라는 두 가지 용어만 있습니다. 이 기간은 연장될 수 있습니다.
![image](https://github.com/dainst/idai-field/assets/29372760/d98802e9-282d-4314-9c4f-491ad66474f8)
용어집 내에서 사용 가능한 모든 문자열과 번역을 볼 수 있고 번역되지 않은 용어를 번역할 수 있습니다.
응용 프로그램의 다른 부분을 번역하는 동안 적절한 용어집 용어를 선택할 수 있으며 사용 가능한 용어와 가까운 문자열 일치가 발견되면 제안됩니다(아래 참조).
![image](https://github.com/dainst/idai-field/assets/29372760/c0ffda73-2c7c-42da-8c8c-3ee6f1d6b63a)
## 사용설명서 번역하기
매뉴얼은 현재 [여기](https://github.com/dainst/idai-field/tree/master/desktop/src/manual)에서 보실 수 있습니다. 이는 Weblate에서 관리되지 않으며 현재 별도로 번역되어야 합니다. 번역 제공에 관심이 있으시면 주저하지 말고 팀에 문의하세요!
## 문제와 질문
영어나 독일어 번역에 문제가 있으면 언제든지 지적해 주시고 [문제](https://github.com/dainst/idai-field/issues)를 작성하여 개발팀이 실수를 인지할 수 있도록 해주세요.
