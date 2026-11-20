// 주제별 평가 질문. want 중 하나라도 고른 개념에 들면 적중.
export type Case = { q: string; want: string[] };
const p = (...n: string[]) => n.map((x) => (x.includes('/') ? `faqs/${x}.md` : `faqs/purchase/faq-${x}.md`));

export const CASES: Record<string, Case[]> = {
  receipts: [
    { q: '현금영수증 번호를 잘못 넣었는데 어떻게 바꿔요?', want: p('etc/faq-099') },
    { q: '포인트로 결제한 금액도 현금영수증 되나요?', want: p('benefit/faq-184') },
    { q: '종이 영수증 말고 앱으로만 받고 싶어요', want: p('etc/faq-036') },
    { q: '취소한 금액 영수증은 어디서 봐요?', want: p('claim/faq-034', '163') },
    { q: '국세청에서 현금영수증은 언제부터 조회돼요?', want: p('etc/faq-097') },
    { q: '여러 개 주문했는데 한 상품만 따로 영수증 뽑을 수 있나요', want: p('etc/faq-111') },
    { q: '상품권이랑 카드 같이 냈는데 증빙 둘 다 받을 수 있어요?', want: p('etc/faq-116') },
    { q: '매장에서 산 영수증을 앱에서 볼 수 있나요?', want: p('membership/faq-102') },
  ],
  delivery: [
    { q: '오늘 저녁에 받으려면 몇 시까지 주문해야 돼요?', want: p('179') },
    { q: '4만원 안 되게 사면 배달비 붙나요?', want: p('175') },
    { q: '택배로 오는 상품은 며칠 걸려요?', want: p('247', '221') },
    { q: '기사님이 왔는데 제가 집에 없었어요. 물건은 어떻게 돼요?', want: p('254', '255', '258') },
    { q: '이미 주문했는데 받는 시간대 바꿀 수 있어요?', want: p('232', '249') },
    { q: '결제했는데 우유 하나 깜박했어요. 배송비 또 내야 돼요?', want: p('240', '239', '234') },
    { q: '제주도 같은 섬도 배달돼요?', want: p('237') },
    { q: '트럭이 지금 어디쯤인지 볼 수 있나요?', want: p('244') },
    { q: '집 근처 매장 말고 먼 매장에서 와요. 왜 그래요?', want: p('238', '101') },
    { q: '주문하고 나서 주소 바꿀 수 있어요?', want: p('174', '251') },
  ],
  payment: [
    { q: '계좌로 직접 송금해서 낼 수 있어요?', want: p('144') },
    { q: '결제 끝났는데 할부 개월 바꿀 수 있나요?', want: p('204') },
    { q: '지갑에 있는 종이 상품권 온라인에서 써도 돼요?', want: p('104') },
    { q: '샘플페이 비밀번호 없이 바로 결제되게 하려면?', want: p('136') },
    { q: '승인 문자가 두 번 왔는데 돈이 두 번 빠져나간 건가요?', want: p('231') },
    { q: '카드 할인 받으면서 포인트도 같이 쓸 수 있나요?', want: p('169', '233') },
  ],
  giftsets: [
    { q: '명절 선물 받는 사람 주소 결제 후에 바꿀 수 있어요?', want: p('011') },
    { q: '선물세트 출고 3일 전인데 취소되나요?', want: p('claim/faq-017') },
    { q: '선물 여러 집으로 한 번에 보내고 싶어요', want: p('021') },
  ],
  pickup: [
    { q: '술 주문한 거 남편이 대신 찾아가도 돼요?', want: p('065') },
    { q: '소주 하루에 몇 병까지 살 수 있어요?', want: p('040') },
    { q: '픽업 시간 놓치면 어떻게 돼요?', want: p('092', '201') },
  ],
  cart: [
    { q: '장바구니에 담아둔 거 며칠 지나면 없어져요?', want: p('162') },
    { q: '재입고 알림 왔는데 들어가 보니 없어요', want: p('007') },
  ],
  coupons: [
    { q: '쿠폰 깜박하고 결제했는데 지금 적용 돼요?', want: p('benefit/faq-048') },
    { q: '장바구니 쿠폰 두 장 같이 쓸 수 있나요?', want: p('benefit/faq-115', 'benefit/faq-046') },
    { q: '앱에서 받은 쿠폰 마트 가서 써도 돼요?', want: p('benefit/faq-217') },
  ],
  points: [
    { q: '포인트 언제 사라져요?', want: p('benefit/faq-194') },
    { q: '포인트 쓰려는데 비밀번호가 뭐예요?', want: p('benefit/faq-191', 'benefit/faq-171') },
    { q: '체크카드 멤버십이면 몇 퍼센트 쌓여요?', want: p('benefit/faq-127', 'benefit/faq-138') },
    { q: '모은 포인트 현금으로 돌려받을 수 있어요?', want: p('benefit/faq-188') },
  ],
  claims: [
    { q: '배송 준비 중인데 주문 취소하고 싶어요', want: p('claim/faq-130', 'claim/faq-176') },
    { q: '카드 취소했는데 언제 카드사에 반영돼요?', want: p('claim/faq-030', 'claim/faq-055', 'claim/faq-128') },
    { q: '카드로 결제한 거 현금으로 환불 가능해요?', want: p('claim/faq-088') },
    { q: '유통기한 짧은 게 왔어요. 바꿔 주세요', want: p('claim/faq-189', 'claim/faq-186') },
    { q: '불량품인데 다른 상품으로 바꿀 수 있어요?', want: p('claim/faq-152') },
  ],
  members: [
    { q: '중학생도 가입할 수 있어요?', want: p('profile/faq-056') },
    { q: '탈퇴하고 바로 다시 가입 돼요?', want: p('profile/faq-181', 'profile/faq-054') },
    { q: '이름 바꿨는데 회원정보 어떻게 고쳐요?', want: p('profile/faq-066') },
    { q: '신용 멤버십 연회비 얼마예요?', want: p('profile/faq-145', 'profile/faq-125') },
  ],
  grades: [
    { q: '이번 달 등급은 언제 기준으로 정해져요?', want: p('membership/faq-062') },
    { q: '금액은 넘었는데 등급이 안 올랐어요', want: p('membership/faq-093', 'membership/faq-087') },
  ],
  items: [
    { q: '앱에서 보는 가격이랑 매장 가격이 달라요', want: p('item/faq-114', 'item/faq-052') },
    { q: '리뷰 쓰면 포인트 얼마 줘요?', want: p('item/faq-098') },
    { q: '담배도 온라인으로 살 수 있어요?', want: p('item/faq-029') },
  ],
  etc: [
    { q: '안 샀는데 결제됐다는 문자가 왔어요', want: p('etc/faq-083') },
    { q: '자꾸 로그인이 풀려요', want: p('etc/faq-033') },
  ],
};
