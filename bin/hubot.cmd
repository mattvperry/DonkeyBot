@echo off
@SET PATH=%PATH%;"%~dp0..\node_modules\.bin"
npm install && node_modules\.bin\hubot.cmd --name "donkeybot" %* 