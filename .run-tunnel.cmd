@echo off
REM Mavr Kids — Cloudflare tunnel. Havola: tunnel.log
cd /d D:\mavr-school\mavr-kids
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:4600 --no-autoupdate > "D:\mavr-school\mavr-kids\tunnel.log" 2>&1
