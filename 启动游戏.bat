@echo off
chcp 65001 >nul
title 极速抢答 · 一键启动

echo ========================================
echo   极速抢答 · 一键启动
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 启动后端服务器 (端口 8080)...
start "后端服务器" cmd /k "cd /d %~dp0api && npm start"

echo.
timeout /t 2 >nul

echo [2/3] 启动前端开发服务器 (端口 5173)...
start "前端开发服务器" cmd /k "cd /d %~dp0 && npm run dev"

echo.
timeout /t 3 >nul

echo [3/3] 自动打开游戏页面...
start "" "http://localhost:5173/"

echo.
echo ========================================
echo   ✅  启动完成！
echo      游戏页面已在浏览器中打开
echo      前端: http://localhost:5173
echo      后端: ws://localhost:8080
echo ========================================
echo.
echo 提示：要关闭服务，请关闭两个子窗口
echo.
pause
