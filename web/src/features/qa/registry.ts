// 번들별 store 모음. 같은 번들이면 처음 만든 store를 계속 돌려준다.
// 앱 루트(QaSessionsProvider)에서 화면마다 하나씩 만들어, 화면을 오가도 store가 남게 한다.
// node 테스트가 별칭을 못 읽으므로 이 파일은 상대 경로로만 import한다(지금은 import가 없다).
export type Registry<T> = {
  get: (bundleId: string) => T;
};

export function createRegistry<T>(make: (bundleId: string) => T): Registry<T> {
  const stores = new Map<string, T>();
  return {
    get(bundleId) {
      let store = stores.get(bundleId);
      if (store === undefined) {
        store = make(bundleId);
        stores.set(bundleId, store);
      }
      return store;
    },
  };
}
