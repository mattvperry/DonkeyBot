@echo off
@SET PATH=%PATH%;"%~dp0..\node_modules\.bin"
npm install --production && node_modules\.bin\tsbot.cmd --name "donkeybot" %* 