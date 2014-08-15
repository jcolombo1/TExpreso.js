rem @echo off

rem minify TExpreso.js standalone
"../minify/jsmin.exe" <TExpreso.js >TExpreso.min.js "(c)2014 Jorge Colombo - jcolombo@ymail.com - t: @jcolombo_ - f: /Jorge Colombo"
"../minify/jsmin.exe" <jquery.TExpreso.js >jquery.TExpreso.min.js "(c)2014 Jorge Colombo - jcolombo@ymail.com - t: @jcolombo_ - f: /Jorge Colombo"

rem ... anexar ambos en uno: jquery.TExpreso.full.min.js ...
copy /Y TExpreso.js+jquery.TExpreso.js zzz.js
"../minify/jsmin.exe" <zzz.js >jquery.TExpreso.full.min.js "(c)2014 Jorge Colombo - jcolombo@ymail.com - t: @jcolombo_ - fb: /Jorge Colombo"
del zzz.js

rem y copiar files a carpeta de aprendizaje
xcopy /Y /D /S /I "test\etc\jquery*min.js" "learn\js"
xcopy /Y /D /I jquery.TExpreso.full.min.js "learn\js"
