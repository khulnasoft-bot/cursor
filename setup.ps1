Invoke-WebRequest -Uri https://github.com/khulnasoft-bot/cursor/releases/download/beta/resources.zip -o ./resources.zip
Invoke-WebRequest -Uri https://github.com/khulnasoft-bot/cursor/releases/download/beta/lsp.zip -o ./lsp.zip

Expand-Archive -Path ./resources.zip -DestinationPath ./
Expand-Archive -Path ./lsp.zip -DestinationPath ./

Remove-Item -Path ./resources.zip
Remove-Item -Path ./lsp.zip
