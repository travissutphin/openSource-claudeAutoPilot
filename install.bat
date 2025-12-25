@echo off
echo.
echo AI-DOCS Framework Installer
echo ============================
echo.

REM Check if we're in the docs-framework directory or parent
if exist "CLAUDE.md.default" (
    set SOURCE=CLAUDE.md.default
    set TARGET=..\CLAUDE.md
) else if exist "docs-framework\CLAUDE.md.default" (
    set SOURCE=docs-framework\CLAUDE.md.default
    set TARGET=CLAUDE.md
) else (
    echo ERROR: Cannot find CLAUDE.md.default
    echo Make sure you're in the project root or docs-framework directory
    exit /b 1
)

REM Check if CLAUDE.md already exists
if exist "%TARGET%" (
    echo WARNING: CLAUDE.md already exists at %TARGET%
    set /p OVERWRITE="Overwrite with default? (y/n): "
    if /i not "%OVERWRITE%"=="y" (
        echo Installation cancelled.
        exit /b 0
    )
)

REM Copy the default file
copy "%SOURCE%" "%TARGET%" > nul
if %ERRORLEVEL% equ 0 (
    echo.
    echo SUCCESS! CLAUDE.md installed.
    echo.
    echo Next steps:
    echo   1. Open Claude Code in this directory
    echo   2. Type: [SetupProject]
    echo   3. Answer the questions or provide your PRD
    echo.
    echo [SetupProject] will update CLAUDE.md with your project config.
    echo.
) else (
    echo ERROR: Failed to copy file
    exit /b 1
)
