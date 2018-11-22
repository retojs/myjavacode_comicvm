@echo off

set LOCAL_URL=http://localhost:3000

echo %LOCAL_URL% | clip

echo ComicVM starting up...
echo To use the comicVM app open %LOCAL_URL%
echo To run the unit tests open %LOCAL_URL%/jasmine


if exist run.js (
   node run.js
)
if exist "..\run.js" (
   cd ..
   node run.js
)

exit /b 1
