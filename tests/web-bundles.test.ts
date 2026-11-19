// 웹 화면의 번들 자동 탐색 (web/src/lib/bundles/groupByBundle.ts)
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { bundleIdOf, groupByBundle, orderBundleIds } from '../web/src/lib/bundles/groupByBundle.ts';

const P = '../../../bundles';

describe('bundleIdOf', () => {
  test('bundles/ 바로 아래 디렉터리 이름', () => {
    assert.equal(bundleIdOf(`${P}/knowledge/policies/returns.md`, 'bundles'), 'knowledge');
  });
  test('bundles/ 바로 아래 파일은 번들이 아니다', () => {
    assert.equal(bundleIdOf(`${P}/README.md`, 'bundles'), null);
  });
  test('점으로 시작하는 디렉터리는 번들이 아니다', () => {
    assert.equal(bundleIdOf(`${P}/.draft/index.md`, 'bundles'), null);
  });
  test('bundles/ 밖은 null', () => {
    assert.equal(bundleIdOf('../../../docs/a.md', 'bundles'), null);
  });
});

describe('groupByBundle', () => {
  test('디렉터리별로 문서와 asset을 나눈다', () => {
    const groups = groupByBundle(
      'bundles',
      { [`${P}/a/index.md`]: 'A', [`${P}/b/index.md`]: 'B', [`${P}/a/x/y.md`]: 'Y', [`${P}/README.md`]: 'R' },
      [`${P}/a/refs/data.json`],
    );
    assert.deepEqual(
      groups.map((g) => [g.id, g.root, Object.keys(g.documents).length, g.assetKeys.length]),
      [
        ['a', 'bundles/a', 2, 1],
        ['b', 'bundles/b', 1, 0],
      ],
    );
  });
});

describe('orderBundleIds', () => {
  test('설정에 적은 순서가 먼저, 나머지는 이름순', () => {
    assert.deepEqual(orderBundleIds(['zeta', 'mart', 'alpha', 'knowledge'], ['knowledge', 'mart']), ['knowledge', 'mart', 'alpha', 'zeta']);
  });
});
