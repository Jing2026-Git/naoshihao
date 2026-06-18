@echo off
echo ========================================
echo   脑师好 - 本地启动器
echo ========================================
echo.
echo 正在启动脑师好...
echo 启动后请在浏览器中打开: http://localhost:8080
echo 按 Ctrl+C 停止服务
echo.

cd /d "%~dp0"

:: 尝试使用 Python 启动服务器
where python >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Python 启动服务器...
    start http://localhost:8080
    python -m http.server 8080
    goto :eof
)

:: 尝试使用 Python3
where python3 >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Python3 启动服务器...
    start http://localhost:8080
    python3 -m http.server 8080
    goto :eof
)

:: 尝试使用 Node.js
where node >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Node.js 启动服务器...
    start http://localhost:8080
    node -e "require('http').createServer((req,res)=>{const fs=require('fs');const path=req.url==='/'?'/index.html':req.url;fs.readFile('.'+path,(e,d)=>{if(e){res.writeHead(404);res.end('Not found')}else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d)}})}).listen(8080)"
    goto :eof
)

echo.
echo 错误：未找到 Python 或 Node.js
echo.
echo 请选择以下任一方式安装：
echo   1. Python: https://www.python.org/downloads/  (推荐，安装时勾选 Add to PATH)
echo   2. Node.js: https://nodejs.org/
echo.
echo 安装后重新运行此脚本即可。
echo.
pause
