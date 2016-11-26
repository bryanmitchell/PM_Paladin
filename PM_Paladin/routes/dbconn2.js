/**
API by PM Paladin's pages:
	Dashboard: getEmployeePassword, getToolDates, getBarChartInfo, getPieChartInfo
	Equipment Management: CRUD Lines/WS/Tools, getPmPro Lines/WS/Tools, setToolActive/Inactive
	User Management: CRUD Employees
	Maintenance Confirmation: getConfirmationTasks, setPartialConfirm, setFullyConfirm
	Maintenance Approval: getApprovalTasks, setApprove
	My Tasks:
**/

var exports = module.exports = {};

var sql = require('mssql');
var bcrypt = require('bcryptjs');
require('dotenv').config();
var salt = bcrypt.genSaltSync(parseInt(process.env.SALT));


function runQuery(query, cp, res) {
	console.log("Gonna create request and run query...");
	var request = new sql.Request(cp);
	request.query(query, function(err, recordset){
		if(err){
			console.log("Query failed: "  + query); 
			console.log(err);
		}
		else{ 
			console.log("Query good!"); 
			console.dir(recordset);
			if (res !== null){ res.send(recordset);}
		}
	});
};

function runPostQuery(query, cp, res) {
	console.log('in dbconn.runPostQuery()');
	var request = new sql.Request(cp);
	request.query(query, function(err, recordset){
		if(err){
			console.log("Query failed: " + query); 
			console.log(err);
			res.send(err);
		} else {
			console.log("Query success!");
			res.send();
		}
	});
};



/**
DASHBOARD
**/
exports.getEmployeePassword = function(cp, req, res){
	var sso = req.body.sso;
	var pwd = req.body.password;
	console.log(bcrypt.hashSync(pwd, salt));
	var query = `
		SELECT e.Sso AS [sso]
			,e.FirstName AS [firstName]
			,e.LastName AS [lastName]
			,e.PasswordHash AS [hash]
			,typeList.types AS [types]
		FROM Employee e 
		INNER JOIN (
			-- SSO and stringified list of types
			SELECT DISTINCT 
				st2.Sso AS [Sso], 
				STUFF((SELECT ',' + st1.EmpRole AS [text()]
						FROM EmployeeRole st1
						WHERE st1.Sso = st2.Sso
						FOR XML PATH('')), 
					1, 1, '' ) AS [types]
			FROM EmployeeRole st2
		) [typeList] 
		ON e.Sso = typeList.Sso 
		WHERE e.Sso = ${sso};`;
	// Return Boolean (user exists, password works) and position string
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query getEmployeePassword success!");
			if(recordset.length == 0 || !bcrypt.compareSync(pwd, recordset[0].hash)){
				res.send({'success': false, 'name': '', 'types': ''});
			} else {
				res.send({
					'success': true,
					'name': recordset[0].firstName + " " + recordset[0].lastName,
					'types': recordset[0].types
				});
			}
		}
	});
};

exports.getToolDates = function(cp,res){
	var query=`
	SELECT t.ToolID AS [toolID]
		,t.ToolName AS [toolName]
		,ws.WorkstationName AS [workstationName]
		,pl.LineName AS [lineName]
		,e.FirstName AS [firstName]
		,e.LastName AS [lastName]
		,dates.Dates AS [date]
	FROM Tool AS t
	INNER JOIN Workstation AS ws
	ON t.WorkstationID = ws.WorkstationID
	INNER JOIN ProductionLine AS pl
	ON ws.LineID = pl.LineID
	INNER JOIN ToolAssignedTo AS tat
	ON t.ToolID = tat.ToolID
	INNER JOIN Employee AS e
	ON tat.Sso = e.Sso
	INNER JOIN (
		SELECT tsk.ToolID AS [ToolID]
			,DATEDIFF(day, GETDATE(), MIN(DATEADD(day,tsk.FrequencyDays,tsk.LastCompleted))) AS [Dates]
		FROM Task AS tsk
		GROUP BY tsk.ToolID) AS [dates]
	ON dates.ToolID = t.ToolID`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'getUpcomingTools' success!");
			console.dir(recordset);
			res.send(recordset);
		}
	});
};

exports.getBarChartInfo = function(cp,res){
	// Approved OnTime and PastDue during the last two weeks
	// var query=`
	// SELECT CONVERT(VARCHAR(10), log.DateFinished, 112) AS [date]
	// 	,log.OnTime AS [onTime]
	// 	,COUNT(*) AS [count]
	// FROM TaskLog AS [log]
	// WHERE DATEDIFF(day, log.DateFinished, GETDATE()) <= 14
	// GROUP BY CONVERT(VARCHAR(10), log.DateFinished, 112), log.OnTime`;
	var query =`
		DECLARE @startDate DATETIME
		DECLARE @endDate DATETIME

		SET @startDate = DATEADD(d,-14,GETDATE())
		SET @endDate = GETDATE();

		WITH dates(Date) AS 
		(
			SELECT @startdate as Date
			UNION ALL
			SELECT DATEADD(d,1,[Date])
			FROM dates 
			WHERE DATE < @enddate
		)

		SELECT CONVERT(VARCHAR(10), dates.Date, 112) AS [Date], 
			ISNULL(OnTimeLogs.OnTimeCount, 0) AS [OnTimeCount], 
			ISNULL(PastDueLogs.PastDueCount, 0) AS [PastDueCount]
		FROM dates
		LEFT OUTER JOIN (
			SELECT CONVERT(VARCHAR(10), log2.DateFinished, 112) AS OnTimeDates, COUNT(*) AS OnTimeCount
			FROM TaskLog AS log2
			WHERE log2.OnTime = 'True'
			GROUP BY CONVERT(VARCHAR(10), log2.DateFinished, 112)
		) AS OnTimeLogs
		ON CONVERT(VARCHAR(10), dates.Date, 112) = CONVERT(VARCHAR(10), OnTimeLogs.OnTimeDates, 112)
		LEFT OUTER JOIN (
			SELECT CONVERT(VARCHAR(10), log3.DateFinished, 112) AS PastDueDates, COUNT(*) AS PastDueCount
			FROM TaskLog AS log3
			WHERE log3.OnTime = 'False'
			GROUP BY CONVERT(VARCHAR(10), log3.DateFinished, 112)
		) AS PastDueLogs
		ON CONVERT(VARCHAR(10), dates.Date, 112) = CONVERT(VARCHAR(10), PastDueLogs.PastDueDates, 112)
		OPTION (MAXRECURSION 0)
	`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'getBarChartInfo' success!");
			console.dir(recordset);
			res.send(recordset);
		}
	});
};

exports.getPieChartInfo = function(cp,res){
	// how many tasks TODAY are OnTime, Upcoming (14 days), PastDue
	var query=`
	SELECT t.status AS [status]
		,COUNT(*) AS [count]
	FROM (
		SELECT CASE 
			WHEN (TaskStatus = 'Past Due')
				THEN 'PastDue' 
			WHEN (TaskStatus = 'OnTime' 
				AND DATEDIFF(day, GETDATE(), DATEADD(day, FrequencyDays, LastCompleted)) BETWEEN 0 AND 14) 
				THEN 'Upcoming'
			WHEN (TaskStatus = 'OnTime' 
				AND DATEDIFF(day, GETDATE(), DATEADD(day, FrequencyDays, LastCompleted)) > 14) 
				THEN 'On Time'
			ELSE 'In Progress'
			END AS [status]
		FROM Task) AS [t]
	GROUP BY t.status`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'getPieChartInfo' success!");
			console.dir(recordset);
			res.send(recordset);
		}
	});
};








/**
EQUIPMENT MANAGEMENT
**/

/* CREATE */
exports.createLine = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		INSERT INTO ProductionLine
			([LineName], [SupervisorFirstName], [SupervisorLastName], [SupervisorEmail])
		VALUES
			('${r.lineName}', '${r.supervisorFirstName}', '${r.supervisorLastName}', '${r.supervisorEmail}');
		`, cp, res);
};
exports.createWorkstation = function(cp, req, res){
	var r = req.body;
	console.log(r);
	var query = `
	DECLARE @wsid INT
	BEGIN TRANSACTION;
	BEGIN TRY
		INSERT INTO Workstation
			([LineID]
			,[WorkstationName]
			,[GreenLightOn]
			,[YellowLightOn]
			,[RedLightOn]
			,[GreenLightModuleNumber]
			,[GreenLightPointNumber]
			,[YellowLightModuleNumber]
			,[YellowLightPointNumber]
			,[RedLightModuleNumber]
			,[RedLightPointNumber])
		VALUES
			(${1}
			,'${r.workstationName}'
			,${1}
			,${0}
			,${0}
			,${r.greenLightModuleNumber}
			,${r.greenLightPointNumber}
			,${r.yellowLightModuleNumber}
			,${r.yellowLightPointNumber}
			,${r.redLightModuleNumber}
			,${r.redLightPointNumber});
		SELECT @wsid = SCOPE_IDENTITY();
		INSERT INTO [dbo].[WorkstationAssignedTo] ([WorkstationID], [Sso])
		VALUES (@wsId, ${r.employeeSso});
		END TRY
		BEGIN CATCH
			SELECT 
				ERROR_NUMBER() AS ErrorNumber
				,ERROR_SEVERITY() AS ErrorSeverity
				,ERROR_STATE() AS ErrorState
				,ERROR_PROCEDURE() AS ErrorProcedure
				,ERROR_LINE() AS ErrorLine
				,ERROR_MESSAGE() AS ErrorMessage;

			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
		END CATCH;
		IF @@TRANCOUNT > 0 
			COMMIT TRANSACTION;
	`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query success!");}
	});

	res.redirect('back');
};
exports.createTool = function(cp, req, res){
	var r = req.body;
	var query = `
		DECLARE @toolId INT
		BEGIN TRANSACTION;
		BEGIN TRY
			INSERT INTO [dbo].[Tool]
				([WorkstationID]
				,[ToolName]
				,[ToolType]
				,[RemoteIoModuleNumber]
				,[RemoteIoPointNumber]
				,[IsActive]
				,[RfidAddress]
				,[Supplier]
				,[YearBought]
				,[OriginalCostDollars])
			VALUES
				(${1}
				,'${r.toolName}'
				,'${r.toolType}'
				,${r.remoteIoModuleNumber}
				,${r.remoteIoPointNumber}
				,${1}
				,${r.rfidAddress}
				,'${r.supplier}'
				,'${r.yearBought}'
				,${r.originalCostDollars});
			SELECT @toolId = SCOPE_IDENTITY();
			INSERT INTO [dbo].[ToolAssignedTo] ([ToolID], [Sso])
			VALUES (@toolId, ${r.employeeSso});

			INSERT INTO [dbo].[Task]
				([ToolID], [EstHours], [FrequencyDays], [TaskDescription], [CreatedOn], [LastCompleted],
				[TaskStatus],[DaysLeft14],[DaysLeft3])
			SELECT (@toolId, p.[Est Hrs], p.[Frequency Days], p.[Description], p.[Created], p.[Last Complet], 
				'OnTime', 0, 0)
			FROM tblPM_ScheduledPmItems spi
			WHERE spi.intEquipRecID = ${r.pmProToolID};

		END TRY
		BEGIN CATCH
			SELECT 
				ERROR_NUMBER() AS ErrorNumber
				,ERROR_SEVERITY() AS ErrorSeverity
				,ERROR_STATE() AS ErrorState
				,ERROR_PROCEDURE() AS ErrorProcedure
				,ERROR_LINE() AS ErrorLine
				,ERROR_MESSAGE() AS ErrorMessage;

			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
		END CATCH;
		IF @@TRANCOUNT > 0 
			COMMIT TRANSACTION;`;

	

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query success!");}
	});

	res.redirect('back');
};


/* READ */
exports.getLines = function(cp, res){
	runQuery(`
		SELECT pl.LineId AS [lineID]
			,pl.LineName AS [lineName]
			,pl.SupervisorFirstName AS [supervisorFirstName]
			,pl.SupervisorLastName AS [supervisorLastName]
			,pl.SupervisorEmail AS [supervisorEmail]
			,pl.RemoteIoAddress AS [remoteIoAddress]
		FROM ProductionLine AS pl;
		`, cp, res);
};
exports.getWorkstations = function(cp, res){
	runQuery(`
		SELECT ws.WorkstationID AS [wsID]
			,ws.WorkstationName AS [wsName]
			,ws.GreenLightModuleNumber AS [GreenLightModuleNumber]
			,ws.GreenLightPointNumber AS [GreenLightPointNumber]
			,ws.YellowLightModuleNumber AS [yellowLightModuleNumber]
			,ws.YellowLightPointNumber AS [yellowLightPointNumber]
			,ws.RedLightModuleNumber AS [redLightModuleNumber]
			,ws.RedLightPointNumber AS [redLightPointNumber]
			,ws.LineID AS [lineID]
			,wat.Sso AS [employeeSso]
		FROM Workstation AS ws 
		INNER JOIN WorkstationAssignedTo as wat
		ON ws.WorkstationID = wat.WorkstationID;
		`, cp, res);
}; // TODO Assumes WS assgined to ONE person
exports.getTools = function(cp, res){
	runQuery(`
		SELECT t.WorkstationID AS [wsID]
			,t.ToolID AS [toolID]
			,t.ToolName AS [toolName] 
			,t.ToolType AS [toolType] 
			,t.RfidAddress AS [rfidAddress]
			,t.RemoteIoModuleNumber AS [RemoteIoModuleNumber]
			,t.RemoteIoPointNumber AS [RemoteIoPointNumber]
			,tat.Sso AS [employeeSso]
		FROM Tool as t 
		INNER JOIN ToolAssignedTo AS tat
		ON t.ToolID = tat.ToolID;
		`, cp, res);
}; // TODO Assumes tool assigned to ONE person


/* UPDATE */
exports.updateLine = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE ProductionLine
		SET LineName = '${r.lineName}'
			,SupervisorFirstName = '${r.supervisorFirstName}'
			,SupervisorLastName = '${r.supervisorLastName}'
			,SupervisorEmail = '${r.supervisorEmail}'
		WHERE LineID = ${r.lineID};
		`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			console.log("Query 'updateWorkstation' success!");
			res.send();
		}
	});
}; // Change when RunPostQuery is changed
exports.updateWorkstation = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE Workstation
		SET GreenLightModuleNumber = ${r.GreenLightModuleNumber}
			,GreenLightPointNumber = ${r.GreenLightPointNumber}
			,YellowLightModuleNumber = ${r.yellowLightModuleNumber}
			,YellowLightPointNumber = ${r.yellowLightPointNumber}
			,RedLightModuleNumber = ${r.redLightModuleNumber}
			,RedLightPointNumber = ${r.redLightPointNumber}
		WHERE workstationId = ${r.wsID};

		UPDATE WorkstationAssignedTo
		SET Sso = ${r.employeeSso}
		WHERE WorkstationID = ${r.wsID};
		`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			console.log("Query 'updateWorkstation' success!");
			res.send();
		}
	});
}; //change when RunPostQuery is changed
exports.updateTool = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE Tool
		SET ToolType = '${r.toolType}'
			,RfidAddress = ${r.rfidAddress}
			,RemoteIoModuleNumber = ${r.RemoteIoModuleNumber}
			,RemoteIoPointNumber = ${r.RemoteIoPointNumber}
		WHERE ToolID = ${r.toolID};

		UPDATE ToolAssignedTo
		SET Sso = ${r.employeeSso}
		WHERE ToolID = ${r.toolID};
		`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			console.log("Query 'updateTool' success!");
			res.send();
		}
	});
}; //change when RunPostQuery is changed


/* DELETE */
exports.deleteLine = function(cp, req, res){
	var r = req.body;
	var query = `
		DELETE FROM [dbo].[ProductionLine]
			WHERE LineID = ${r.lineID}`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			// Handle if assigned Workstations
			console.log(err);
			res.send(err);
		}
		else{console.log("Query deleteLine success!");}
	});
};
exports.deleteWorkstation = function(cp, req, res){
	var r = req.body;
	var query = `
		DELETE FROM [dbo].[Workstation]
			WHERE WorkstationID = ${r.workstationID}`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			// handle if assigned Tools
			console.log(err);
			res.send(err);
		}
		else{console.log("Query deleteWorkstation success!");}
	});
};
exports.deleteTool = function(cp, req, res){
	var r = req.body;
	var query = `
		DELETE FROM [dbo].[Tool]
			WHERE ToolID = ${r.toolID}`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			console.log("Query deleteTool success!");
			res.send();
		}
	});
};


/* READ FROM PM PRO */
exports.getPmProLines = function(cp,res){
	query = `
		SELECT DISTINCT eqlist.strProduct_line_t AS [lineName]
		FROM tblPM_MasterEquipment AS eqlist;`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{res.send(recordset);}
	});
};
exports.getPmProWorkstations = function(cp,res){
	query = `
		SELECT eqlist.strEquipID AS [workstationName]
			,eqlist.strProduct_line_t AS [lineName]
		FROM tblPM_MasterEquipment AS eqlist;`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{res.send(recordset);}
	});
};
exports.getPmProTools = function(cp,res){
	query = `
		SELECT DISTINCT eqlist.strEquipDescription AS [toolName]
			,eqlist.intEquipRecID AS [pmProToolID]
			,eqlist.strEquipID AS [workstationName]
			,eqlist.strProduct_line_t AS [lineName]
			,eqlist.strEquip_Supplier AS [supplier]
			,eqlist.datYearMaker AS [yearBought]
			,eqlist.fltOriginalCost_USDollar AS [originalCostDollars]
		FROM tblPM_MasterEquipment AS eqlist;`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{res.send(recordset);}
	});
};


/* TOOL OPERATION CONTROL */
exports.setToolActive = function(cp,req,res){
	var r = req.body;
	var query=`
	UPDATE [dbo].[Tool]
	SET [IsActive] = 1
	WHERE ToolID = ${r.toolID}`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query 'setActive' success!");}
	});
};
exports.setToolInactive = function(cp,req,res){
	var r = req.body;
	var query=`
	UPDATE [dbo].[Tool]
	SET [IsActive] = 0
	WHERE ToolID = ${r.toolID}`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query 'setInactive' success!");}
	});
};

/* RFID GET/SET (Under consideration) */
exports.getScannedRfidTag = function(cp,res){
	var query=`SELECT [value] AS [rfidTag] FROM [dbo].[Flags] WHERE [Name] = 'RfidAddress'`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'getScannedRfidTag' success!");
			res.send(recordset);
		}
	});
};
exports.setRfidRegisterFlagOn = function(cp,res){
	var query=`UPDATE [dbo].[Flags] SET [Name] = 1`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query 'setRfidRegisterFlagOn' success!");}
	});
};






/**
USER MANAGEMENT
**/
exports.createEmployee = function(cp, req, res){
	var r = req.body;
	query = `
		INSERT INTO Employee
			([Sso],[FirstName],[LastName],[Email],[PasswordHash])
		VALUES
			(${r.sso},'${r.firstName}','${r.lastName}','${r.email}','${bcrypt.hashSync(r.password, salt)}');
		`
	for (i = 0; i < r.employeeType.length; i++){
		query +=`
			INSERT INTO EmployeeRole ([Sso],[EmpRole]) 
			VALUES (${r.sso},'${r.employeeType[i]}');
		`;
	}
	if (r.employeeType.indexOf('Technician') > -1){
		query += `
			INSERT INTO EmployeeSupervisor
				([Sso],[FirstName],[LastName],[Email])
			VALUES
				(${r.sso}, ${r.supervisorFirstName}, ${r.supervisorLastName}, ${r.supervisorEmail})`;
	}
	runPostQuery(query, cp, res);
}; //TODO FIX

exports.getEmployees = function(cp, res){
	console.log("Getting all employees...");
	runQuery(`
		SELECT e.Sso as [sso]
			,e.FirstName AS [firstName]
			,e.LastName AS [lastName]
			,e.Email AS [email]
			,typeList.types AS [types]
			,es.FirstName AS [supervisorFirstName]
			,es.LastName AS [supervisorLastName]
			,es.Email AS [supervisorEmail]
		FROM Employee e 
		INNER JOIN (
			SELECT DISTINCT st2.Sso AS [Sso],
				STUFF((SELECT ',' + st1.EmpRole AS [text()]
					FROM EmployeeRole st1
					WHERE st1.sso = st2.sso
					FOR XML PATH('')
					), 1, 1, '' )
				AS [types]
			FROM EmployeeRole st2
		) [typeList] 
		ON e.Sso = typeList.Sso
		LEFT OUTER JOIN EmployeeSupervisor es
		ON e.Sso = es.Sso;
		`, cp, res);
};

exports.updateEmployee = function(cp, req, res){
	var r = req.body;
	var types = r.types.split(',');

	// First query
	var query = `
		UPDATE Employee
		SET FirstName = '${r.firstName}'
			,LastName = '${r.lastName}'
			,Email = '${r.email}'
			,PasswordHash = '${bcrypt.hashSync(r.password, salt)}'
		WHERE Sso = ${r.sso};
		`;
	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			console.log("Query updateEmployee (1/2) success!");
		}
	});

	// Delete employee roles and technician supervisor
	var query2 = `
		BEGIN TRANSACTION;
		BEGIN TRY
		DELETE FROM EmployeeType
		WHERE Sso = ${r.sso}
		DELETE FROM EmployeeSupervisor
		WHERE Sso = ${r.sso}
		`;

	// Insert employee roles
	for (var i=0; i<types.length; i++){
		console.log('in for');
		query2 += `
			INSERT INTO EmployeeRole ([Sso],[EmpRole]) 
			VALUES (${r.sso}, '${types[i]}')`;
		if (i==types.length-1){query2+=`;\n`;}
		else{query2+=`\n`;}
	}

	// Insert supervisor
	if (types.indexOf('Technician') > -1){
		query += `
			INSERT INTO EmployeeSupervisor
				([Sso],[FirstName],[LastName],[Email])
			VALUES
				(${r.sso}, ${r.supervisorFirstName}, ${r.supervisorLastName}, ${r.supervisorEmail})`;
	}
	query2 += `
		END TRY
		BEGIN CATCH
			SELECT 
				ERROR_NUMBER() AS ErrorNumber
				,ERROR_SEVERITY() AS ErrorSeverity
				,ERROR_STATE() AS ErrorState
				,ERROR_PROCEDURE() AS ErrorProcedure
				,ERROR_LINE() AS ErrorLine
				,ERROR_MESSAGE() AS ErrorMessage;

			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
		END CATCH;
		IF @@TRANCOUNT > 0 
			COMMIT TRANSACTION;`;
	// Second query
	runPostQuery(query2, cp, res);
};

exports.deleteEmployee = function(cp, req, res){
	var r = req.body;
	var query = `
		DELETE FROM [dbo].[Employee]
			WHERE Sso = ${r.sso}`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			// if user in ToolAssignedTo, return error
			// if user in WSAssignedTo, return error
			console.log(err);
		}
		else{
			console.log("Query deleteEmployee success!");
			res.send();
		}
	});
};







/**
MAINTENANCE CONFIRMATION
**/
exports.getConfirmationTasks = function(cp, req, res){
	// http://stackoverflow.com/questions/63447/how-to-perform-an-if-then-in-an-sql-select
	console.log("Getting confirmation tasks...");
	runQuery(`
		SELECT tsk.TaskID AS [Task], 
			tsk.TaskDescription AS [Desc], 
			t.ToolName AS [Tool], 
			ws.WorkstationName AS [WS], 
			pl.LineName AS [Line],
			eng.FirstName AS [EngFName], 
			eng.LastName AS [EngLName], 
			eng.Email AS [EngEmail], 
			tec.FirstName AS [TecFName], 
			tec.LastName AS [TecLName], 
			REPLACE(CAST(CASE 
				WHEN tsk.TaskStatus = 'ConfirmPartial' THEN 'Y' 
				ELSE 'N' 
				END AS CHAR),' ', '') AS [Partial] 
		FROM Task as tsk 
		INNER JOIN Tool as t 
		ON tsk.ToolID = t.ToolID 
		INNER JOIN Workstation AS ws 
		ON t.WorkstationID = ws.WorkstationID 
		INNER JOIN ProductionLine AS pl 
		ON ws.LineID = pl.LineID 
		INNER JOIN ToolAssignedTo AS tat 
		ON t.ToolID = tat.ToolID 
		INNER JOIN Employee AS tec 
		ON tat.Sso = tec.Sso 
		INNER JOIN WorkstationAssignedTo AS wat 
		ON ws.WorkstationID = wat.WorkstationID 
		INNER JOIN Employee AS eng 
		ON wat.Sso = eng.Sso 
		WHERE (tsk.TaskStatus = 'ConfirmPending' OR tsk.TaskStatus = 'ConfirmPartial') 
		AND tec.sso = ${req.body.sso};
		`, cp, res);
};

exports.setPartialConfirm = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE [dbo].[Task]
		SET [TaskStatus] = 'ConfirmPartial'
		WHERE TaskID IN (${r.tasks.toString()})
	`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'setPartialConfirm' success!");
			refreshActiveBit(cp);
		}
	});
};

exports.setFullConfirm = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE [dbo].[Task]
		SET [TaskStatus] = 'ApprovePending'
		WHERE TaskID IN (${r.tasks.toString()})
	`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'setFullConfirm' success!");
			refreshActiveBit(cp);
		}
	});	
};







/**
MAINTENANCE APPROVAL
**/
exports.getApprovalTasks = function(cp, req, res){
	// http://stackoverflow.com/questions/63447/how-to-perform-an-if-then-in-an-sql-select
	console.log("Getting approval tasks...");
	runQuery(`
		SELECT tsk.TaskID AS [Task], 
			tsk.TaskDescription AS [Desc], t.toolName AS [Tool], 
			ws.WorkstationName AS [WS], 
			pl.LineName AS [Line], 
			eng.FirstName AS [EngFName], 
			eng.LastName AS [EngLName], 
			tec.FirstName AS [TecFName], 
			tec.LastName AS [TecLName], 
			pl.SupervisorFirstName AS [LineSupervisorFName], 
			pl.SupervisorLastName AS [LineSupervisorLName], 
			pl.SupervisorEmail AS [LineSupervisorEmail]
		FROM Task as tsk 
		INNER JOIN Tool as t 
		ON tsk.ToolID = t.ToolID 
		INNER JOIN Workstation AS ws 
		ON t.WorkstationID = ws.WorkstationID 
		INNER JOIN ProductionLine AS pl 
		ON ws.LineID = pl.LineID 
		INNER JOIN WorkstationAssignedTo AS wat 
		ON ws.WorkstationID = wat.WorkstationID 
		INNER JOIN Employee AS eng 
		ON wat.Sso = eng.Sso 
		INNER JOIN ToolAssignedTo AS tat
		ON tat.ToolID = t.ToolID
		INNER JOIN Employee AS tec
		ON tat.Sso = tec.Sso
		WHERE tsk.TaskStatus = 'ApprovePending' 
		AND eng.Sso = ${req.body.sso};
		`, cp, res);
};

exports.setApprove = function(cp, req, res){
	var r = req.body;
	var query = `
		UPDATE [dbo].[Task]
		SET [TaskStatus] = 'OnTime'
			,[LastCompleted] = GETDATE()
		WHERE TaskID IN (${r.tasks.toString()});
		
		UPDATE [dbo].[TaskLog]
		SET [DateFinished] = GETDATE()
		WHERE LogID IN 
			(SELECT [tsk].[LastLog]
			FROM [dbo].[Task] AS [tsk]
			WHERE [tsk].[TaskID] IN (${r.tasks.toString()}))
	`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
		else{
			console.log("Query 'setApprove' success!");
			refreshActiveBit(cp);
		}
	});
};





var refreshActiveBit = function(cp){
	var query = `
		UPDATE Tool
		SET [IsActive] = 0
		FROM(
			SELECT ToolID, COUNT(*) AS [OffToolCount]
			FROM Task 
			WHERE TaskStatus = 'PastDue'
			OR TaskStatus = 'ConfirmPending'
			OR TaskStatus = 'ApprovePending'
			GROUP BY ToolID) AS [OffTools]
		WHERE OffToolCount > 0;

		UPDATE Tool
		SET [IsActive] = 1
		FROM(
			SELECT ToolID, COUNT(*) AS [OffToolCount]
			FROM Task 
			WHERE TaskStatus = 'PastDue'
			OR TaskStatus = 'ConfirmPending'
			OR TaskStatus = 'ApprovePending'
			GROUP BY ToolID) AS [OffTools]
		WHERE OffToolCount = 0;
		`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){console.log(err);}
	});
};
