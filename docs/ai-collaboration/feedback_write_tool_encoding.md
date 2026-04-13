---
name: Write 도구 한글 CSV 인코딩 깨짐
description: Claude Code Write 도구로 한글 포함 CSV 작성 시 인코딩 깨짐 발생 → bash printf로 우회 필요
type: feedback
originSessionId: f334a3b2-ab5c-4401-9594-5fe3cde2d404
---
Claude Code의 Write 도구로 한글이 포함된 CSV 파일을 작성하면 특정 한글 글자가 깨짐 (예: "김선순" → "김선���").

**Why:** Write 도구의 내부 인코딩 처리가 일부 한글 코드포인트를 손상시킴. 2026-04-12 test_case1.csv 작성 중 발견.

**How to apply:**
- 한글이 포함된 파일 생성 시 Write 도구 대신 `bash printf` 사용
- 예: `printf 'student_name,1,2,3\n김선순,O,X,O\n' > file.csv`
- JSX/JS 등 코드 파일의 한글 문자열은 Write 도구로 정상 작성 가능 (CSV만 문제)