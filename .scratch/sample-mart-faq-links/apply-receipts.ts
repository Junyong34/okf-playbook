// 영수증 파일럿: FAQ의 tags·description을 바꾸고 본문 끝에 '관련 문서' 절을 붙인다. 한 번만 실행한다.
import { readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';

const ROOT = 'bundles/sample_mart_faq/';
const HUB = 'topics/receipts.md';
type Item = { tags: string[]; description: string; label: string; related: string[] };
const F: Record<string, Item> = {
  'faqs/etc/faq-036.md': { tags: ['모바일영수증', '전자영수증', '종이영수증'], label: '전자(모바일) 영수증 설정',
    description: '종이 영수증 대신 앱으로 모바일(전자) 영수증만 받도록 설정하는 위치를 안내하는 FAQ입니다.', related: ['faqs/etc/faq-044.md', 'faqs/membership/faq-102.md'] },
  'faqs/etc/faq-044.md': { tags: ['구매영수증', '주문내역서', '종이영수증'], label: '종이 주문내역서 대신 영수증 확인',
    description: '종이 주문내역서(주문서)가 오지 않을 때 온라인 구매영수증을 마이페이지에서 확인하는 방법에 관한 FAQ입니다.', related: ['faqs/etc/faq-036.md', 'faqs/etc/faq-111.md'] },
  'faqs/etc/faq-097.md': { tags: ['현금영수증', '국세청', '발급내역'], label: '현금영수증 발급내역 확인',
    description: '현금영수증 발급내역을 국세청 홈페이지에서 언제부터 조회할 수 있는지에 관한 FAQ입니다.', related: ['faqs/etc/faq-099.md', 'faqs/benefit/faq-184.md'] },
  'faqs/etc/faq-099.md': { tags: ['현금영수증', '국세청', '번호수정'], label: '현금영수증 번호 잘못 등록',
    description: '현금영수증 신청 때 휴대전화번호를 잘못 넣었을 때 국세청에 수정을 요청하는 방법에 관한 FAQ입니다.', related: ['faqs/etc/faq-097.md', 'faqs/etc/faq-044.md'] },
  'faqs/etc/faq-111.md': { tags: ['구매영수증', '부분발급', '주문단위'], label: '일부 상품 영수증 발급',
    description: '여러 상품을 주문했을 때 일부 상품만 따로 영수증을 받을 수 있는지(주문 단위 발급)에 관한 FAQ입니다.', related: ['faqs/etc/faq-044.md', 'faqs/purchase/faq-129.md'] },
  'faqs/etc/faq-116.md': { tags: ['현금영수증', '카드매출전표', '상품권', '복합결제'], label: '상품권·카드 복합결제 영수증',
    description: '디지털 상품권과 카드를 함께 결제했을 때 현금영수증과 카드매출전표(증빙)를 각각 받는지에 관한 FAQ입니다.', related: ['faqs/benefit/faq-184.md', 'faqs/claim/faq-034.md'] },
  'faqs/benefit/faq-184.md': { tags: ['현금영수증', '포인트', '마일리지'], label: '포인트 사용 시 현금영수증',
    description: '포인트·적립금·쿠폰 등 마일리지로 결제한 금액에 현금영수증이 발급되는지에 관한 FAQ입니다.', related: ['faqs/etc/faq-116.md', 'faqs/etc/faq-097.md'] },
  'faqs/purchase/faq-129.md': { tags: ['구매영수증', '취소영수증', '대체주문영수증', '금액차이'], label: '결제금액과 영수증금액 차이',
    description: '주문 때 결제금액과 배송 뒤 영수증금액이 다를 때 취소영수증·대체주문영수증으로 확인하는 방법에 관한 FAQ입니다.', related: ['faqs/claim/faq-034.md', 'faqs/etc/faq-111.md'] },
  'faqs/claim/faq-034.md': { tags: ['취소영수증', '환불금액', '복합결제'], label: '결제 금액과 환불 금액이 다를 때',
    description: '여러 결제수단으로 낸 주문의 환불금액이 결제수단별로 나뉘는 이유와 취소영수증 확인 위치에 관한 FAQ입니다.', related: ['faqs/purchase/faq-163.md', 'faqs/purchase/faq-129.md'] },
  'faqs/purchase/faq-163.md': { tags: ['취소영수증', '환불금액', '복합결제'], label: '결제 금액과 환불 금액이 다를 때(주문/결제/배송)',
    description: '여러 결제수단으로 낸 주문의 환불금액이 결제수단별로 나뉘는 이유와 취소영수증 확인에 관한 FAQ입니다.', related: ['faqs/claim/faq-034.md', 'faqs/purchase/faq-129.md'] },
  'faqs/membership/faq-102.md': { tags: ['매장영수증', '오프라인구매', '구매실적'], label: '오프라인 구매 실적·매장 영수증 확인',
    description: '매장(오프라인)에서 산 구매 실적과 매장 영수증을 앱에서 확인하는 위치에 관한 FAQ입니다.', related: ['faqs/etc/faq-036.md', 'faqs/claim/faq-060.md'] },
  'faqs/claim/faq-060.md': { tags: ['매장반품', '모바일영수증'], label: '온라인 구매 상품의 매장 교환·반품',
    description: '온라인에서 산 상품을 매장에서 교환·반품할 수 있는지와 모바일 영수증으로 결제 매장을 확인하는 방법에 관한 FAQ입니다.', related: ['faqs/membership/faq-102.md'] },
};
const q = (s: string) => JSON.stringify(s);
for (const [path, it] of Object.entries(F)) {
  let text = readFileSync(ROOT + path, 'utf8');
  if (text.includes('\n## 관련 문서')) throw new Error(`이미 적용됨: ${path}`);
  const cat = text.match(/^tags: \["([^"]+)"/m)![1]; // 카테고리 태그는 첫 자리에 그대로 둔다
  text = text.replace(/^description: .*$/m, `description: ${q(it.description)}`)
             .replace(/^tags: .*$/m, `tags: [${[cat, '영수증', ...it.tags, 'FAQ'].map(q).join(', ')}]`);
  const rel = (to: string) => posix.relative(posix.dirname(path), to);
  const lines = [`* [영수증 안내](${rel(HUB)}) - 영수증 종류별 확인 위치와 현금영수증 발급을 묶은 주제 문서.`,
    ...it.related.map((r) => `* [${F[r].label}](${rel(r)})`)];
  // 각주 정의 앞에 넣는다. 각주는 문서 끝에 두는 관례를 지킨다.
  const at = text.search(/^\[\^sample-faq\]:/m);
  text = text.slice(0, at) + `## 관련 문서\n\n${lines.join('\n')}\n\n` + text.slice(at);
  writeFileSync(ROOT + path, text);
}
console.log(`${Object.keys(F).length}개 수정`);
