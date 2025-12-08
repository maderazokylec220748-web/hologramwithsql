Set WshShell = CreateObject("WScript.Shell")

' Start dev server hidden in background
WshShell.Run "cmd /c cd /d ""C:\Users\USER\hologramsql-main"" && npm run dev", 0, False

' Wait 5 seconds for servers to start
WScript.Sleep 5000

' Start electron app (also hidden console)
WshShell.Run "cmd /c cd /d ""C:\Users\USER\hologramsql-main"" && npm run electron", 0, False

Set WshShell = Nothing
