@echo off
@SET PATH=%PATH%;"%~dp0..\node_modules\.bin"
node_modules\.bin\tsbot.cmd --name "donkeybot" %* 
