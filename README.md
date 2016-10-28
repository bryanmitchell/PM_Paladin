# PM_Paladin

## TODO
1. Attaching DB to other servers
2. Sending data from DB to Angular HTML
3. Finish implementing db functions (they're in routes/deprecated_api.js) and arranging them in api.js
4. URL Routing
5. Update DB with ToolNo and WorkstationNo columns

## Our development environment
Bryan Mitchell: MacBook Pro (Early 2011), OS X Yosemite
Luis Murphy: Lenovo Y40-80, Windows 10 Home

## Setting up DB
1. Install Microsoft SQL Server 2016 Express (setup file included) and Microsoft SQL Server Management Studio (setup file not included)
2. Open Services.msc
3. Make sure SQL Server (SQLEXPRESS), and SQL Server Browser are Running
4. Jot down SQLEXPRESS service 'Log On As' value
4. Open SQL Server Configuration Manager 
5. Go to SQL Server Services and make sure SQL Server and SQL Server Browser are also running
6. Go to SQL Server Network Configuration > Protocols for SQL Express and make sure TCP/IP is on. If not, enable and restart the services (Server, Browser)
7. Right-click mdf and ldf files, Properties, Security, Edit, Add, enter 'Log On As' value from Step 4
8. Open SSMS, right-click on Databases folder (in Object Explorer), click Attach, add Your\Path\PM_Paladin\PM_Paladin\data\paladin.mdf and OK (might bump into an error...)
9. If all else fails, open SSMS as admin, log on with Windows authentication, good luck.

## Setting up Node/Express development
Download project from Git
Install Node.js (v4.6.1 included)
```
C:\Users\You> npm install npm@latest -g
C:\Users\You> npm install -g express
C:\Users\You> npm install -g express-generator
C:\Users\You> cd Your\Path\PM_Paladin\PM_Paladin
C:\Users\You\PM_Paladin\PM_Paladin> express --ejs` (You should skip this, this creates the express scaffold
C:\Users\You\PM_Paladin\PM_Paladin> npm install
C:\Users\You\PM_Paladin\PM_Paladin> npm install -g nodemon
C:\Users\You\PM_Paladin\PM_Paladin> npm install sendgrid
C:\Users\You\PM_Paladin\PM_Paladin> npm install -g browserify
C:\Users\You\PM_Paladin\PM_Paladin> npm install dotenv --save
C:\Users\You\PM_Paladin\PM_Paladin> npm install mssql
C:\Users\You\PM_Paladin\PM_Paladin> npm install bcryptjs
```

## To start your server:
`C:\Users\You\PM_Paladin\PM_Paladin> nodemon app`
Or if you don't care about server auto-restart upon file changes:
`C:\Users\You\PM_Paladin\PM_Paladin> nodemon app`
and leave running forever... :)

Note that if you make BIG changes to the files, turn nodemon off or your computer WILL lag.

Remember to set your ./public/app/.env file with:
SENDGRID_USERNAME = your_username
SENDGRID_PASSWORD = your_password
TO = your.email@gmail.com