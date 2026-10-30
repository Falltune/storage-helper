@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo 未找到 Python。请先安装 Python 3.10 或更高版本，并将其加入 PATH。
  pause
  exit /b 1
)

python app.py %*
if errorlevel 1 (
  echo.
  echo 服务没有正常启动，请查看上方信息。
  pause
)
