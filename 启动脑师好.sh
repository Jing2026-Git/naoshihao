#!/bin/bash
echo "========================================"
echo "  脑师好 - 本地启动器"
echo "========================================"
echo ""
echo "正在启动脑师好..."
echo "启动后请在浏览器中打开: http://localhost:8080"
echo "按 Ctrl+C 停止服务"
echo ""

cd "$(dirname "$0")"

if command -v python3 &> /dev/null; then
    echo "使用 Python3 启动服务器..."
    open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null &
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "使用 Python 启动服务器..."
    open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null &
    python -m http.server 8080
elif command -v node &> /dev/null; then
    echo "使用 Node.js 启动服务器..."
    open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null &
    node -e "require('http').createServer((req,res)=>{const fs=require('fs');const path=req.url==='/'?'/index.html':req.url;fs.readFile('.'+path,(e,d)=>{if(e){res.writeHead(404);res.end('Not found')}else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d)}})}).listen(8080)"
else
    echo "错误：未找到 Python 或 Node.js"
    echo ""
    echo "请先安装 Python: https://www.python.org/downloads/"
    echo "安装后重新运行此脚本即可。"
fi
