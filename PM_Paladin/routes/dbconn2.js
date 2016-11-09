var exports = module.exports = {};

var sql = require('mssql');
var bcrypt = require('bcryptjs');
require('dotenv').config();
var salt = bcrypt.genSaltSync(parseInt(process.env.SALT));

// https://journalofasoftwaredev.wordpress.com/2011/10/30/replicating-string-format-in-javascript/
String.prototype.format = function()
{
	var content = this;
	for (var i=0; i < arguments.length; i++)
	{
		var replacement = '{' + i + '}';
		content = content.replace(replacement, arguments[i]);  
	}
	return content;
};

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

function runPostQuery(query, cp) {
	console.log('in dbconn.runPostQuery()');
	var request = new sql.Request(cp);
	request.query(query, function(err, recordset){
		if(err){
			console.log("Query failed: " + query); 
			console.log(err);
		} else {
			console.log("Query success!");
		}
	});
};



// Displayed in User Management
exports.getEmployees = function(cp, res){
	console.log("Getting all employees...");
	runQuery(`
		SELECT e.Sso as [sso]
			,e.FirstName AS [firstName]
			,e.LastName AS [lastName]
			,e.Email AS [email]
			,typeList.types AS [types]
		FROM Employee e 
		INNER JOIN (
			SELECT DISTINCT st2.Sso AS [Sso],
				STUFF((SELECT ',' + st1.EmployeeRole AS [text()]
					FROM EmployeeRole st1
					WHERE st1.sso = st2.sso
					FOR XML PATH('')
					), 1, 1, '' )
				AS [types]
			FROM EmployeeRole st2
		) [typeList] 
		ON e.Sso = typeList.Sso;
		`, cp, res);
};

// Task list displayed in Maintenance Confirmation
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

// Task list displayed in Maintenance Approval
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

exports.getEmployeePassword = function(cp, req, res){
	var sso = req.body.sso;
	var pwd = req.body.password;

	var query = `
		SELECT 
			-- Boolean for user exists and password correct
			CASE WHEN EXISTS (
				SELECT *
				FROM Employee e1 
				WHERE e1.Sso = ${sso} 
				AND e1.PasswordHash = '${bcrypt.hashSync(pwd, salt)}'
			)
			THEN CAST(1 AS BIT)
			ELSE CAST(0 AS BIT) END AS [success]
			,typeList.types 
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
	runQuery(query, cp, res);
};

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

// TODO Assumes WS assgined to ONE person
exports.getWorkstations = function(cp, res){
	runQuery(`
		SELECT ws.workstationID AS [wsID]
			,ws.workstationName AS [wsName]
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
};

// TODO Assumes tool assigned to ONE person
exports.getTools = function(cp, res){
	runQuery(`
		SELECT tws.workstationID AS [wsID]
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
};





exports.createEmployee = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		INSERT INTO Employee
			([Sso],[FirstName],[LastName],[Email],[PasswordHash])
		VALUES
			(${r.sso},'${r.firstName}','${r.lastName}','${r.email}','${bcrypt.hashSync(r.password, salt)}');
		`, cp);
	for (i = 0; i < r.employeeType.length; i++){
		runPostQuery(`
			INSERT INTO EmployeeRole ([Sso],[EmpRole]) 
			VALUES (${r.sso},'${r.employeeType[i]}');
			`, cp);
	}
	res.redirect('back');
};

exports.createLine = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		INSERT INTO ProductionLine
			([LineName], [SupervisorFirstName], [SupervisorLastName], [SupervisorEmail])
		VALUES
			('${r.lineName}', '${r.supervisorFirstName}', '${r.supervisorLastName}', '${r.supervisorEmail}');
		`, cp);
	res.redirect('back');
};

exports.createWorkstation = function(cp, req, res){
	var r = req.body;
	console.log(r);
	var query1 = `
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
			,${r.workstationName}
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
		INSERT INTO [dbo].[WorkstationAssignedTo] ([workstationId], [employeeSso])
		VALUES (@wsId, ${r.sso});
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

	new sql.Request(cp).query(query1, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query success!");}
	});

	res.redirect('back');
};

exports.createTool = function(cp, req, res){
	var r = req.body;
	console.log(r);

	var query1 = `
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
			   ,${r.toolName}
			   ,${r.toolType}
			   ,${r.remoteIoModuleNumber}
			   ,${r.remoteIoPointNumber}
			   ,${1}
			   ,${r.rfidAddress}
			   ,${'GE'}
			   ,${'2016-10-29'}
			   ,${100.00});
			SELECT @toolId = SCOPE_IDENTITY();
			INSERT INTO [dbo].[ToolAssignedTo] ([toolId], [employeeSso])
			VALUES (@toolId, ${r.sso});
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

	new sql.Request(cp).query(query1, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query success!");}
	});

	res.redirect('back');
};





exports.updateLine = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		UPDATE ProductionLine
		SET LineName = '${r.lineName}'
			,SupervisorFirstName = '${r.supervisorFirstName}'
			,SupervisorLastName = '${r.supervisorLastName}'
			,SupervisorEmail = '${r.supervisorEmail}'
		WHERE LineID = ${r.lineID};
		`, cp);
	res.redirect('back');
};

exports.updateWorkstation = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		UPDATE Workstation
		SET workstationName = '${r.wsName}'
			,GreenLightModuleNumber = CONVERT(INT, ${r.greenLightModuleNumber})
			,GreenLightPointNumber = CONVERT(INT, ${r.greenLightPointNumber})
			,YellowLightModuleNumber = CONVERT(INT, ${r.yellowLightModuleNumber})
			,YellowLightPointNumber = CONVERT(INT, ${r.yellowLightPointNumber})
			,RedLightModuleNumber = CONVERT(INT, ${r.redLightModuleNumber})
			,RedLightPointNumber = CONVERT(INT, ${r.redLightPointNumber})
		WHERE workstationId = ${wsID};

		UPDATE WorkstationAssignedTo
		SET Sso = ${r.employeeSso}
		WHERE WorkstationID = ${wsID};
		`, cp);
	res.redirect('back');
};

exports.updateTool = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		UPDATE Tool
		SET ToolName = '${r.toolName}'
			,ToolType = '${r.toolType}'
			,RfidAddress = CONVERT(INT, ${r.rfidAddress})
			,RemoteIoModuleNumber = CONVERT(INT, ${r.remoteIoModuleNumber})
			,RemoteIoPointNumber = CONVERT(INT, ${r.remoteIoPointNumber})
		WHERE ToolID = ${r.toolID};

		UPDATE ToolAssignedTo
		SET Sso = ${r.employeeSso}
		WHERE ToolID = ${r.toolID};
		`, cp);
	res.redirect('back');
};

exports.updateEmployee = function(cp, req, res){
	var r = req.body;
	var types = r.types.split(',');
	runPostQuery(`
		UPDATE Employee
		SET FirstName = '${r.firstName}'
			,LastName = '${r.lastName}'
			,Email = '${r.email}'
			,PasswordHash = '${bcrypt.hashSync(r.password, salt)}'
		WHERE Sso = ${r.sso};
		`, cp);

	var query2 = `
		BEGIN TRANSACTION;
		BEGIN TRY
		DELETE FROM EmployeeType
		WHERE Sso = ${r.sso}
		`;
	for (var i=0; i<types.length; i++){
		console.log('in for');
		query2 += `
			INSERT INTO EmployeeRole ([Sso],[EmpRole]) 
			VALUES (${r.sso}, '${types[i]}')`;
		if (i==types.length-1){query2+=`;\n`;}
		else{query2+=`\n`;}
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
	runPostQuery(query2, cp);
	res.redirect('back');
};



exports.deleteLine = function(cp, req, res){
	var r = req.body;
	var query = `
		DELETE FROM [dbo].[ProductionLine]
			WHERE LineID = ${r.lineID}`;

	new sql.Request(cp).query(query, function(err, recordset){
		if(err){
			// Handle if assigned Workstations
			console.log(err);
		}
		else{console.log("Query success!");}
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
		}
		else{console.log("Query success!");}
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
		}
		else{console.log("Query success!");}
	});
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
		else{console.log("Query success!");}
	});
};