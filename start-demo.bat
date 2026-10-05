@echo off
cd /d "%~dp0"
echo ClassPulse live demo - open http://localhost:8000 in your browser.
where py >nul 2>nul
if errorlevel 1 goto usepython
py -3 server.py
goto done
:usepython
python server.py
:done
pause
