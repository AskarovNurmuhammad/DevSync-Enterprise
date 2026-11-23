@echo off
title DevSync Backend
echo ============================================
echo   DevSync Enterprise - Backend (NestJS)
echo ============================================
echo.
cd /d "%~dp0backend"
npm run start:dev
pause
