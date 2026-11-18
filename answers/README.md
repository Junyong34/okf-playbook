# answers

5회차에 채팅 모델 답변을 질문별로 저장하는 곳이다. 파일 이름은 `evaluation.md`의 질문 번호를 따른다(`q1.txt` ~ `q6.txt`).

```
pnpm -s prompt "반품이 승인됐는데 언제 환불되나요?" | pbcopy   # 프롬프트 복사 → 모델에 붙여 넣기
pnpm check-answer "반품이 승인됐는데 언제 환불되나요?" answers/q4.txt
```
