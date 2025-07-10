@echo off
echo 🔄 변경사항 GitHub에 푸시 중...

cd /d %~dp0

git add .
set /p msg="커밋 메시지를 입력하세요: "
git commit -m "%msg%"
git push origin main

pause
