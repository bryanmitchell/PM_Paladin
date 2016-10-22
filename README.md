# PM_Paladin
## Our development environment
Bryan Mitchell: MacBook Pro (Early 2011), OS X Yosemite
Luis Murphy: Lenovo Y40-80, Windows 10 Home

## Setting up DB
1. Install Microsoft SQL Server 2016 Express (setup file included) and Microsoft SQL Server Management Studio (setup file not included)
2. Open Services.msc
3. Make sure SQL Server (SQLEXPRESS), and SQL Server Browser are Running.
4. Open SQL Server Configuration Manager 
5. Go to SQL Server Services and make sure SQL Server and SQL Server Browser are also running
6. Go to SQL Server Network Configuration > Protocols for SQL Express and make sure TCP/IP is on. If not, enable and restart the services (Server, Browser)

## Setting up Node/Express development
Download from Git
Install Node.js (v 4.6.1 included)
```
C:\Users\You> npm install npm@latest -g
C:\Users\You> npm install -g expres
C:\Users\You> npm install -g express-generator
C:\Users\You> cd Your\Path\PM_Paladin\PM_Paladin
C:\Users\You\PM_Paladin\PM_Paladin> express --ejs` (You should skip this, this creates the express scaffold
C:\Users\You\PM_Paladin\PM_Paladin> npm install
C:\Users\You\PM_Paladin\PM_Paladin> npm install -g nodemon
C:\Users\You\PM_Paladin\PM_Paladin> npm install mssql
C:\Users\You\PM_Paladin\PM_Paladin> npm install bcryptjs
```
C:\Users\You\PM_Paladin\PM_Paladin> nodemon app
OR- 
node bin/www`

## To start your server:
```
C:\Users\You\PM_Paladin\PM_Paladin> nodemon app
```
Or if you don't care about server auto-restart upon file changes:
```
C:\Users\You\PM_Paladin\PM_Paladin> nodemon app
```
and leave running forever... :)

Note that if you make BIG changes to the files, turn nodemon off.

