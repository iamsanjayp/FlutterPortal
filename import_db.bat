@echo off
echo Importing MobileDev Portal Database...
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < import_all_tables.sql
echo.
echo Database import completed!
pause
