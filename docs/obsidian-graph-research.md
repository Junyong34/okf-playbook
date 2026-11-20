# Obsidian 그래프 뷰와 오픈소스 구현

2026-11-18 조사

Obsidian의 기본 그래프 뷰는 앱에 내장된 코어 플러그인이다. Obsidian은 공식 배포 저장소에서 앱 소스가 비공개라고 명시한다. 웹에서 유사한 상호작용을 구현할 때는 Quartz의 공개 소스가 참고 사례이며, 소규모 번들을 직접 표시하려면 `force-graph`가 레이아웃과 렌더링을 함께 제공한다. [Obsidian 배포 저장소](https://github.com/obsidianmd/obsidian-releases#about-this-repo) · [Obsidian Graph view](https://obsidian.md/help/plugins/graph) · [Quartz Graph](https://github.com/quartz-community/graph) · [force-graph](https://github.com/vasturiano/force-graph)

## Obsidian에서 공개한 기능과 개발 이력

- **전체 그래프와 로컬 그래프.** 노트는 노드, 내부 링크는 간선이다. 더 많은 노트에서 참조하는 노드가 커진다. 노드에 마우스를 올리면 연결이 강조되고 클릭하면 노트가 열린다. 검색 필터와 색상 그룹, 화살표, 노드와 간선 크기를 조절할 수 있다. 로컬 그래프는 현재 노트 기준으로 여러 홉까지 탐색하며 들어오는 링크와 나가는 링크를 각각 숨길 수 있다. [Graph view 공식 도움말](https://obsidian.md/help/plugins/graph) · [Desktop 0.9.0 릴리스 노트](https://obsidian.md/changelog/2020-09-21-desktop-v0.9.0/)
- **힘 기반 배치.** 중심 힘, 노드 사이의 밀어내는 힘, 링크로 연결된 노드가 당기는 힘과 링크 거리를 설정할 수 있다. [Graph view 공식 도움말](https://obsidian.md/help/plugins/graph)
- **2020년 성능 개선.** Desktop 0.8.10에서는 파일 변경을 감지하면 바뀐 부분을 기준으로 그래프를 갱신하도록 했고, 0.8.15에서는 물리 계산보다 화면 프레임 그리기를 우선했다. 0.9.0에서 시뮬레이션을 워커 스레드로 옮겼다. 0.9.2에서는 성능과 배터리 사용량을 개선하기 위해 시뮬레이션 엔진을 다시 작성했고, 렌더러 초기화 속도를 높였다. 표시 설정을 바꿀 때 시뮬레이션을 다시 시작하던 동작도 제거했다. [0.8.10](https://obsidian.md/changelog/2020-08-31-desktop-v0.8.10/) · [0.8.15](https://obsidian.md/changelog/2020-09-14-desktop-v0.8.15/) · [0.9.0](https://obsidian.md/changelog/2020-09-21-desktop-v0.9.0/) · [0.9.2](https://obsidian.md/changelog/2020-09-30-desktop-v0.9.2/)
- **PixiJS 사용 근거.** 2022년 공식 포럼에서 joethei는 당시 렌더링에 PixiJS를 사용하며 이전 D3 구현은 성능이 부족했다고 설명했다. 2026년 Desktop 1.15 릴리스 노트는 그래프를 처음 열 때 `PIXI` 전역을 로드한다고 명시한다. 최신 버전의 구체적인 배치 알고리즘은 공개 자료에서 확인하지 못했다. [포럼의 구현 설명](https://forum.obsidian.md/t/understanding-the-graph-view-core/41020) · [Desktop 1.15 릴리스 노트](https://obsidian.md/changelog/2026-11-02-desktop-v1.15.0/#developers)
- **플러그인 API와 내부 타입.** Obsidian의 공개 API는 `MetadataCache`에서 문서 링크 정보를 읽고 `registerView()`로 커스텀 뷰를 만드는 기능을 제공한다. Extended Graph가 쓰는 `GraphView`·`LocalGraphView` 타입은 커뮤니티가 관리하는 미문서화 API 타입 프로젝트 `obsidian-typings`에서 가져온다. 해당 타입과 플러그인 코드는 내부 객체에 접근하는 방법을 보여준다. [Obsidian 공식 API](https://github.com/obsidianmd/obsidian-api) · [Extended Graph 소스](https://github.com/ElsaTam/obsidian-extended-graph/blob/master/src/helpers/plugins.ts) · [obsidian-typings](https://github.com/obsidian-typings/obsidian-typings)

## 공개 구현 사례

| 프로젝트 | 구현에서 확인할 수 있는 내용 |
| --- | --- |
| **Quartz Graph** · MIT | 웹에 게시한 Markdown 문서의 전체·로컬 그래프. D3로 좌표를 계산하고 PixiJS로 그리며, 문서 연결은 Quartz 콘텐츠 인덱스에서 가져온다. Quartz 5에서는 그래프가 별도 플러그인으로 제공된다. [Quartz 5 문서](https://quartz.jzhao.xyz/features/graph-view) · [플러그인 소스](https://github.com/quartz-community/graph) · [Quartz 4 그래프 소스](https://github.com/jackyzha0/quartz/blob/v4/quartz/components/scripts/graph.inline.ts) |
| **Juggl** · GPL-3.0 | Cytoscape.js 기반 Obsidian 커스텀 그래프. 로컬 그래프를 탐색하며 노드를 추가하거나 숨길 수 있고, 간선 유형과 여러 배치를 지원한다. [Juggl 소스](https://github.com/HEmile/juggl) |
| **Extended Graph** · GPL-3.0 | Obsidian의 기존 그래프 뷰에 노드와 간선 표시 기능을 추가하는 플러그인. Obsidian 안에서 그래프를 확장하는 코드의 예로 볼 수 있다. [Extended Graph 소스와 기능 목록](https://github.com/ElsaTam/obsidian-extended-graph) |
| **Graph Plus** · MIT | 속성에서 관계 유형을 읽고, 유형마다 간선에 색을 지정하는 Obsidian용 커스텀 2D·3D 그래프. OKF의 본문 링크와 출처 관계를 시각적으로 구분할 때 참고할 수 있다. [Graph Plus 소스](https://github.com/NicolasOng/graph-plus) · [구현 구조](https://github.com/NicolasOng/graph-plus/blob/main/ARCHITECTURE.md) |
| **Fast Graph View** · GPL-3.0 및 Obsidian 링크 예외 | WebGL로 렌더링하고 Web Worker에서 힘 기반 배치를 계산한다. 큰 폴더는 단일 노드로 묶는다. 제작자 측정에서 Obsidian 1.14.4의 노트 27,266개가 있는 보관함을 노드 1,546개와 간선 4,795개로 그렸다. 집계가 적용된 특정 데이터의 자체 측정이며, 동일한 수의 개별 노트를 렌더링하는 벤치마크로 해석할 수 없다. [Fast Graph View 설명과 측정](https://community.obsidian.md/plugins/fast-graph-view) |

Fast Graph View의 성능 설계는 소스에서 따라갈 수 있다. 워커가 Barnes–Hut 근사로 배치를 계산하고, 렌더러는 같은 종류의 도형을 WebGL2 인스턴싱으로 한 번에 그린다. 라벨은 별도 2D 레이어에 그리고, 배치와 화면이 안정되면 다음 입력까지 프레임 루프를 멈춘다. [Fast Graph View 소스와 설계](https://github.com/cyrill0/fast-graph-view#why-it-is-fast)

## OKF 웹 뷰어에 적용할 수 있는 라이브러리

| 후보 | 맞는 용도 |
| --- | --- |
| **force-graph** · MIT | HTML Canvas와 `d3-force`를 묶은 2D 컴포넌트. 줌·이동·드래그·클릭, 화살표, 점선, 곡선 간선을 지원한다. [force-graph API](https://github.com/vasturiano/force-graph) · [간선 강조 데모](https://vasturiano.github.io/force-graph/example/highlight/) |
| **Cytoscape.js** · MIT | 그래프 탐색과 스타일 옵션이 필요할 때 적합하다. 간선 유형별 스타일, 방향 화살표, 같은 두 노드를 잇는 병렬 간선용 곡선, 선택한 노드의 이웃 조회를 지원한다. [Cytoscape.js API](https://js.cytoscape.org/) |
| **Sigma.js + Graphology** · MIT | WebGL로 많은 노드와 간선을 그리는 후보. Sigma.js는 렌더링과 상호작용을 맡고, 그래프 자료 구조와 ForceAtlas2 같은 좌표 배치는 Graphology 패키지로 구성할 수 있다. [Sigma.js 소스](https://github.com/jacomyal/sigma.js) · [Graphology ForceAtlas2](https://graphology.github.io/standard-library/layout-forceatlas2.html) |
| **Cosmos.gl** · MIT | WebGL2에서 힘 기반 배치와 렌더링을 모두 GPU로 실행한다. 노드 위치 계산이 병목일 때 비교할 후보다. [Cosmos.gl 소스](https://github.com/cosmosgl/graph) |

현재 그래프 타입에는 노드 경로·제목·유형, 간선 방향과 `link`·`source` 구분, 끊어진 간선 표시가 있다. `buildGraph`와 `backlinks`는 실습 TODO다. [`src/okf/graph.ts`](../src/okf/graph.ts)

OKF 데이터의 브라우저 표시 사례로는 Google Cloud의 참조 뷰어가 있다. 빌드 시 번들을 JSON으로 변환해 HTML에 넣고, 브라우저에서 Cytoscape.js로 그래프를 그린다. [OKF 공식 저장소의 뷰어 설명](https://github.com/GoogleCloudPlatform/open-knowledge-format#readme)

나중에 소규모 반품·환불 번들을 웹에서 탐색한다면 `force-graph`로 시작할 수 있다. 노드 ID에 경로를 쓰고, 같은 두 노드를 잇는 두 종류의 간선에는 실선과 점선에 곡률 차이를 더하면 겹친 관계를 읽기 쉽다. 선택한 개념 주위의 1홉 보기와 끊어진 링크의 대상 경로 표시를 붙이면 탐색과 검증에 모두 쓸 수 있다. Quartz는 전체·로컬 그래프를 웹에서 구성하는 방법을 보여준다. [force-graph API](https://github.com/vasturiano/force-graph) · [Quartz Graph View](https://quartz.jzhao.xyz/features/graph-view)

수천 개 문서를 대상으로 성능을 비교한다면 같은 노드 수, 간선 수, 라벨 표시 조건을 사용해야 한다. 최초 조작 가능 시점, 배치가 진행되는 동안의 확대·이동, 배치가 끝난 뒤의 확대·이동을 따로 재면 병목이 어디에 있는지 판단하기 쉽다. 이번 조사는 공개 문서와 소스를 바탕으로 했으며 직접 벤치마크는 수행하지 않았다.
