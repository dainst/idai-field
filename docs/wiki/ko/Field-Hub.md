Field Hub는 [Field Desktop](../../../desktop) 클라이언트를 사용하여 다양한 프로젝트에 대한 중앙 동기화 서버 역할을 할 수 있습니다.
일반적으로 필드 데이터 동기화에는 두 가지 측면이 있습니다.
1. 이미지 데이터
2. 데이터베이스 데이터
이미지 데이터는 파일 시스템에 직접 파일로 저장되며, 다른 모든 데이터는 [CouchDB](https://couchdb.apache.org/)(Field Hub) 또는 [PouchDB](https://pouchdb.com/)(Field Desktop)에 저장됩니다. Field Hub는 CouchDB 설치에 대한 간단한 역방향 프록시 역할을 합니다. CouchDB와 PouchDB는 기본적으로 데이터베이스 상태를 동기화할 수 있기 때문입니다(공식 [문서](https://docs.couchdb.org/en/stable/replication/index.html) 참조). 이 역방향 프록시 외에도 Field Hub 애플리케이션은 이미지 파일 동기화 논리를 구현합니다.
이미 자체 CouchDB를 실행하고 있는 경우 그에 따라 환경 변수를 설정하여 Field Hub를 함께 설치할 수 있습니다(아래 참조). 각 프로젝트는 CouchDB 내에 자체 데이터베이스를 생성합니다.
# 설치
## 권장 서버 사양
Field Hub는 CPU 및 RAM 사용과 관련하여 리소스를 많이 사용하지 않습니다. 주요 관심사는 아마도 사용 가능한 하드 드라이브 공간일 것입니다. 프로젝트에서 고해상도 이미지가 많이 생성될 수 있으므로 그에 따라 계획을 세우십시오.
## 사전 요구 사항
* [Docker](https://www.docker.com/)
* CouchDB 설치
## 배포
Docker 이미지는 현재 GitHub Container Registry: https://github.com/dainst/idai-field/pkgs/container/field_hub.에서 호스팅됩니다.
**Environment variables**
* HOST는 애플리케이션을 실행할 호스트 도메인입니다(예: "server.field.idai.world").
* SECRET_KEY_BASE, 64자 임의 문자열, https://hexdocs.pm/phoenix/deployment.html#handling-of-your-application-secrets. 참조
* COUCHDB_URL, CouchDB 설치에 대한 기본 URL(예: "http://example.com:5984".)
* COUCHDB_ADMIN_NAME, CouchDB의 관리자 사용자 이름입니다.
* COUCHDB_ADMIN_PASSWORD, CouchDB의 관리자 비밀번호입니다.
* COUCHDB_USER_NAME, Field Hub에서 사용하는 애플리케이션 사용자 이름입니다. setup 명령을 실행하면 사용자가 생성됩니다.
* COUCHDB_USER_PASSWORD, Field Hub에서 사용하는 애플리케이션 사용자 비밀번호입니다.
**Volumes**
Field Hub 애플리케이션은 Docker 컨테이너 내의 `/files`에 동기화된 이미지를 저장합니다. 이미지를 영구적으로 만들려면 이에 따라 호스트 볼륨을 마운트하고 컨테이너 사용자 [`nobody`](https://en.wikipedia.org/wiki/Nobody_(username))에게 읽기/쓰기 액세스 권한이 있는지 확인해야 합니다.
[배포 예시](https://github.com/dainst/idai-field/tree/master/server/deployment_example)도 참조하세요.
## 프로젝트 설정
새 프로젝트를 생성하려면 CouchDB 관리자로 로그인하세요.
초기 페이지에서는 Field Hub 서버의 모든 프로젝트를 볼 수 있습니다. 새로 설치하면 "새 프로젝트 만들기" 버튼만 표시됩니다. 그러면 프로젝트 식별자와 비밀번호를 결정해야 하는 해당 인터페이스로 이동됩니다.
### Field Desktop에 이미 기존 프로젝트가 있는 경우
Field Desktop 애플리케이션과 동일한 프로젝트 식별자를 사용해야 합니다. 프로젝트 식별자가 무엇인지 확실하지 않은 경우 데스크톱 애플리케이션의 오른쪽 상단에 있는 이름을 클릭하세요. 그러면 "프로젝트 편집" 창이 열리고 상단 표시줄에 "프로젝트 이름"이 굵게 표시되고 그 뒤에 프로젝트 식별자가 표시됩니다. "프로젝트 이름"을 설정하지 않은 경우 프로젝트 식별자만 굵게 표시됩니다.
Field Hub에서 올바른 프로젝트 식별자를 사용하여 프로젝트를 생성한 후에는 데스크톱 응용 프로그램에서 동기화를 설정할 수 있습니다.
### 새 프로젝트를 시작하려는 경우
FieldHub는 빈 데이터베이스만 초기화하므로 실제 프로젝트 설정은 Field Desktop에서 수행되어야 합니다. 따라서 먼저 Desktop 클라이언트에서 새 프로젝트를 생성하고 평소와 같이 구성을 설정합니다. 그런 다음 Field Hub에서 일치하는 프로젝트 식별자를 사용하여 프로젝트를 만든 다음 데스크톱 응용 프로그램에서 FieldHub 서버로 동기화하세요.
그런 다음 다른 사용자는 Field Desktop의 "프로젝트 다운로드" 기능을 사용하여 새로 설정된 프로젝트를 가져와야 합니다.
# 백업 생성
정기적으로 백업을 생성하는 것이 좋습니다.
## 데이터베이스
CouchDB를 백업하려면 공식 [문서](https://docs.couchdb.org/en/stable/maintenance/backups.html)를 참조하세요.
## 이미지 파일
[배포](#배포) 섹션에 설명된 대로 파일은 Docker 컨테이너 내의 `/files`에 저장됩니다.
__일반적으로 컨테이너가 다시 생성될 때 데이터 손실을 방지하려면 항상 Docker 볼륨을 `/files`에 마운트해야 합니다.__
Field Hub는 이미지 데이터를 절대 삭제하지 않습니다. 동기화 중에 Field Hub가 `delete` 요청을 받으면 원본 파일은 유지되고 Field Hub는 다음과 같은 이름의 빈 파일을 생성합니다.
삭제 표시 접미사(`<file UUID>.deleted`). 이후 Field Hub는 동기화하는 동안 파일을 삭제된 것으로 처리합니다.
# 백업 복원
동일한 프로젝트 이름으로 백업을 복원하는 것은 까다롭습니다. 왜냐하면 한 사람이 여전히 이전 상태를 사용하고 Field Hub와 적극적으로 동기화하는 한 동기화 논리는 복원된 백업에서 해당 사람의 상태로 빠르게 전달되기 때문입니다. 따라서 새 프로젝트 이름이나 업데이트된 프로젝트 이름으로 백업을 복원하는 것이 좋습니다.
1. Database
* `.couch` 파일을 복사하여 백업한 경우 백업된 `.couch` 파일을 새 데이터베이스 이름으로 CouchDB의 `data/shards` 디렉터리에 복사합니다. 예를 들어 `my_project.1234567890.couch`는 `my_project_backup.1234567890.couch`가 될 수 있습니다.
* 복제를 사용하여 백업한 경우 `my_project_backup`와 같은 업데이트된 이름으로 백업을 Field Hub에서 사용하는 CouchDB에 복제하세요.
그런 다음 [Fauxton](https://couchdb.apache.org/fauxton-visual-guide/index.html)에서 데이터베이스를 열고 프로젝트의 `Project` 문서를 검색하세요.
```JSON
{
   "selector": {
      "resource.type": "Project"
   }
}
```
문서를 열고 `identifier` 필드를 업데이트하여 새 프로젝트 이름과 일치시키고 문서를 저장합니다.
2. 이미지 파일
백업된 이미지 파일을 새 이름 `<path on your host>/files/my_project_backup/`로 Field Hub의 이미지 디렉터리에 복사합니다. Field Hub가 복사된 디렉터리를 읽고 쓸 수 있는지 확인하세요.
3. 사용자 다시 만들기
`create_project_with_default_user` CLI 함수 중 하나를 실행하여 `my_project_backup` 프로젝트의 사용자를 다시 생성하세요. 스크립트는 프로젝트가 이미 존재한다는 피드백을 제공하지만 어쨌든 새 사용자와 비밀번호를 생성합니다.
4. 현장 사용자에게 알리기
이제 Field 사용자에게 새 자격 증명으로 `my_project_backup` 프로젝트를 다운로드하라는 메시지를 표시할 수 있습니다.
