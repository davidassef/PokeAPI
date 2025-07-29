@echo off
echo Instalando tarefa de recuperação de cache...
schtasks /Create /TN "PokeAPI-Cache-Recovery" /XML "D:\Documentos\Python\PokeAPI_SYNC\backend\automation\pokemon_cache_recovery.xml"
echo Tarefa instalada com sucesso!
echo Para verificar: schtasks /Query /TN "PokeAPI-Cache-Recovery"
echo Para remover: schtasks /Delete /TN "PokeAPI-Cache-Recovery" /F
pause
