# answers

5회차에 채팅 모델 답변을 질문별로 저장하는 곳이다. 파일 이름은 `evaluation.md`의 질문 번호를 따른다(`q1.txt` ~ `q6.txt`).

```
pnpm -s prompt "반품이 승인됐는데 언제 환불되나요?" | tee answers/q4.prompt.txt | pbcopy   # 프롬프트 저장·복사 → 모델에 붙여 넣기
pnpm check-answer "반품이 승인됐는데 언제 환불되나요?" answers/q4.txt --prompt answers/q4.prompt.txt
```

`--prompt`를 주면 저장한 프롬프트의 `<document path>`에서 모델에 준 문서를 읽는다. 빼면 검색을 다시 돌려 구하므로, 그 사이 번들이나 설정이 바뀌었으면 실제로 준 문서와 다를 수 있다.
