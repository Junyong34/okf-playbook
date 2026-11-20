// 대화 날짜 구분선 문구: 오늘 / 어제 / 11월 18일 / (해가 다르면) 2025년 11월 18일. 브라우저 시간대 기준.
const dayStart = (at: number) => {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

export function sameDay(a: number, b: number): boolean {
  return dayStart(a) === dayStart(b);
}

export function dayLabel(at: number, now: number): string {
  const days = Math.round((dayStart(now) - dayStart(at)) / 86_400_000);
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  const date = new Date(at);
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() === new Date(now).getFullYear() ? monthDay : `${date.getFullYear()}년 ${monthDay}`;
}
