var exports = module.exports = {};

var sql = require('mssql');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

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

function runPostQuery(query, cp, callbackList) {
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
		SELECT e.sso, e.firstName, e.lastName, e.email, typeList.types 
		FROM Employee e 
		INNER JOIN (
			SELECT DISTINCT st2.sso AS [sso],
				STUFF((SELECT ',' + st1.employeeType AS [text()]
					FROM EmployeeType st1
					WHERE st1.sso = st2.sso
					FOR XML PATH('')
					), 1, 1, '' )
				AS [types]
			FROM EmployeeType st2
		) [typeList] 
		ON e.sso = typeList.sso;
		`, cp, res);
};

// Task list displayed in Maintenance Confirmation
exports.getConfirmationTasks = function(cp, res, empSso){
	// http://stackoverflow.com/questions/63447/how-to-perform-an-if-then-in-an-sql-select
	console.log("Getting confirmation tasks...");
	runQuery(`
		SELECT tsk.taskId AS [Task], tsk.taskDescription AS [Desc], t.toolName AS [Tool], ws.workstationName AS [WS], pl.lineName AS [Line],
			eng.firstName AS [EngFName], eng.lastName AS [EngLName], eng.email AS [EngEmail], tec.firstName AS [TecFName], tec.lastName AS [TecLName], 
			REPLACE(CAST(CASE 
				WHEN tsk.taskStatus = 'ConfirmPartial' THEN 'Y' 
				ELSE 'N' 
				END AS CHAR),' ', '') AS [Partial] 
		FROM Task as tsk 
		INNER JOIN ToolRequiresTask AS trt 
		ON trt.taskId = tsk.taskId 
		INNER JOIN Tool as t 
		ON trt.toolId = t.toolId 
		INNER JOIN ToolInWorkstation AS tws 
		ON t.toolId = tws.toolId 
		INNER JOIN Workstation AS ws 
		ON tws.workstationId = ws.workstationId 
		INNER JOIN WorkstationInLine AS wsl 
		ON ws.workstationId = wsl.workstationId 
		INNER JOIN ProductionLine AS pl 
		ON wsl.lineId = pl.lineId 
		INNER JOIN ToolAssignedTo AS tat 
		ON t.toolId = tat.toolId 
		INNER JOIN Employee AS tec 
		ON tat.employeeSso = tec.sso 
		INNER JOIN WorkstationAssignedTo AS wat 
		ON ws.workstationId = wat.workstationId 
		INNER JOIN Employee AS eng 
		ON wat.employeeSso = eng.sso 
		WHERE (tsk.taskStatus = 'ConfirmPending' OR tsk.taskStatus = 'ConfirmPartial') 
		AND tec.sso = {0};
		`.format(empSso), cp, res);
};

// Task list displayed in Maintenance Approval
exports.getApprovalTasks = function(cp, res, empSso){
	// http://stackoverflow.com/questions/63447/how-to-perform-an-if-then-in-an-sql-select
	console.log("Getting approval tasks...");
	runQuery(`
		SELECT tsk.taskId AS [Task], tsk.taskDescription AS [Desc], t.toolName AS [Tool], ws.workstationName AS [WS], pl.lineName AS [Line], 
			eng.firstName AS [EngFName], eng.lastName AS [EngLName], tec.firstName AS [TecFName], tec.lastName AS [TecLName], 
			pl.supervisorFirstName AS [LineSupervisorFName], supervisorLastName AS [LineSupervisorLName], supervisorEmail AS [LineSupervisorEmail]
		FROM Task as tsk 
		INNER JOIN ToolRequiresTask AS trt 
		ON trt.taskId = tsk.taskId 
		INNER JOIN Tool as t 
		ON trt.toolId = t.toolId 
		INNER JOIN ToolInWorkstation AS tws 
		ON t.toolId = tws.toolId 
		INNER JOIN Workstation AS ws 
		ON tws.workstationId = ws.workstationId 
		INNER JOIN WorkstationInLine AS wsl 
		ON ws.workstationId = wsl.workstationId 
		INNER JOIN ProductionLine AS pl 
		ON wsl.lineId = pl.lineId 
		INNER JOIN WorkstationAssignedTo AS wat 
		ON ws.workstationId = wat.workstationId 
		INNER JOIN Employee AS eng 
		ON wat.employeeSso = eng.sso 
		INNER JOIN ToolAssignedTo AS tat
		ON tat.toolId = t.toolId
		INNER JOIN Employee AS tec
		ON tat.employeeSso = tec.sso
		WHERE tsk.taskStatus = 'ApprovePending' 
		AND eng.sso = {0};
		`.format(empSso), cp, res);
};

exports.getEmployeePassword = function(cp, req, res){
	var sso = req.body.sso;
	var pwd = req.body.password;

	// Return Boolean (user exists, password works) and position string
	runQuery(`
		SELECT CASE WHEN EXISTS (
			SELECT *
			FROM Employee e1 
			WHERE e1.sso = {0} 
			AND e1.passwordHash = '{1}'
		)
		THEN CAST(1 AS BIT)
		ELSE CAST(0 AS BIT) END, typeList.types 
		FROM Employee e 
		INNER JOIN (
			SELECT DISTINCT st2.sso AS [sso],
				STUFF((SELECT ',' + st1.employeeType AS [text()]
					FROM EmployeeType st1
					WHERE st1.sso = st2.sso
					FOR XML PATH('')
					), 1, 1, '' )
				AS [types]
			FROM EmployeeType st2
		) [typeList] 
		ON e.sso = typeList.sso;
		`.format(sso, bcrypt.hashSync(pwd, salt)), cp, res);
};

exports.getLines = function(cp, res){
	runQuery(`
		SELECT pl.lineId AS [lineID], pl.lineName AS [lineName]
		FROM ProductionLine AS pl;
		`, cp, res);
};

exports.getWorkstations = function(cp, res){
	runQuery(`
		SELECT ws.workstationId AS [wsID], ws.workstationName AS [wsName], pl.lineId AS [lineID]
		FROM Workstation AS ws 
		INNER JOIN WorkstationInLine AS wsl 
		ON ws.workstationId = wsl.workstationId 
		INNER JOIN ProductionLine AS pl 
		ON wsl.lineId = pl.lineId;
		`, cp, res);
};

exports.getTools = function(cp, res){
	runQuery(`
		SELECT ws.workstationId AS [wsID], t.toolId AS [toolID], t.toolName AS [toolName] 
		FROM Tool as t 
		INNER JOIN ToolInWorkstation AS tws 
		ON t.toolId = tws.toolId 
		INNER JOIN Workstation AS ws 
		ON tws.workstationId = ws.workstationId;
		`, cp, res);
};

exports.createEmployee = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		INSERT INTO Employee
			([sso],[firstName],[lastName],[email],[passwordHash])
		VALUES
			({0},'{1}','{2}','{3}','{4}');
		`.format(r.sso, r.firstName, r.lastName, r.email, bcrypt.hashSync(r.password, salt)), cp);
	for (i = 0; i < r.employeeType.length; i++){
		console.log("for loop: "+i);
		console.log(r.employeeType[i]);
		runPostQuery(`
			INSERT INTO EmployeeType ([sso],[employeeType]) 
			VALUES ({0},'{1}');
			`.format(r.sso, r.employeeType[i]), cp);
	}
	res.redirect('back');
};

exports.createLine = function(cp, req, res){
	var r = req.body;
	runPostQuery(`
		INSERT INTO ProductionLine
			([lineName], [supervisorFirstName], [supervisorLastName], [supervisorEmail])
		VALUES
			('{0}', '{1}', '{2}', '{3}');
		`.format(r.lineName, r.supervisorFirstName, r.supervisorLastName, r.supervisorEmail), cp);
	res.redirect('back');
};

exports.createWorkstation = function(cp, req, res){
	var r = req.body;
	console.log(r);
	var query1 = `
	DECLARE @wsId INT
	BEGIN TRANSACTION;
	BEGIN TRY
		INSERT INTO Workstation
			([workstationName]
			,[greenLightOn]
			,[yellowLightOn]
			,[redLightOn]
			,[greenLightOpcTag]
			,[yellowLightOpcTag]
			,[redLightOpcTag])
		VALUES
			('{0}'
			,CAST({1} AS BIT)
			,CAST({2} AS BIT)
			,CAST({3} AS BIT)
			,CAST('{4}' AS VARBINARY(MAX))
			,CAST('{5}' AS VARBINARY(MAX))
			,CAST('{6}' AS VARBINARY(MAX)));
		SELECT @wsId = SCOPE_IDENTITY();
		INSERT INTO [dbo].[WorkstationAssignedTo]
			([workstationId], [employeeSso])
		VALUES
			(@wsId, {7});
		INSERT INTO [dbo].[WorkstationInLine]
			([lineId], [workstationId])
		VALUES
			({8}, @wsId);
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
	`.format(r.workstationName, 1, 0, 0, r.greenLightOpcTag, r.yellowLightOpcTag, r.redLightOpcTag, r.employeeSso, 1);

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
				([toolName]
				,[toolType]
				,[supplier]
				,[yearBought]
				,[isActive]
				,[originalCostDollars]
				,[rfidAddress]
				,[opcTag]
				,[ioAddress])
			VALUES
				('{0}','{1}','{2}','{3}',{4},{5}
				,CAST('{6}' AS VARBINARY(MAX))
				,CAST('{7}' AS VARBINARY(MAX))
				,CAST('{8}' AS VARBINARY(MAX)));
			SELECT @toolId = SCOPE_IDENTITY();
			INSERT INTO [dbo].[ToolInWorkstation]
				([workstationId],[toolId])
			VALUES
				({9},@toolId);
			INSERT INTO [dbo].[ToolAssignedTo]
				([toolId], [employeeSso])
			VALUES
				(@toolId, {10});
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
		`.format(r.toolName, r.toolType, 'GE', '2016-10-29', 1, 100.00, r.rfidAddress, r.opcTag, r.ioAddress, 1, r.employeeSso);

	new sql.Request(cp).query(query1, function(err, recordset){
		if(err){console.log(err);}
		else{console.log("Query success!");}
	});

	// var query2 = `
	// 	INSERT INTO [dbo].[ToolInWorkstation]
	// 		([workstationId],[toolId])
	// 	VALUES
	// 		({0},{1});`;

	// var query3 = `
	// 	INSERT INTO [dbo].[ToolAssignedTo]
	// 		([toolId], [employeeSso])
	// 	VALUES
	// 		({0}, {1});`;

	// new sql.Request(cp).query(query1, function(err, recordset){
	// 	if(err){console.log(err);}
	// 	else{
	// 		console.log("Query success!");
	// 		new sql.Request(cp).query(
	// 			query2.format(1, recordset[0].id), 
	// 			function(err){if(err){console.log(err);}}
	// 		);
	// 		new sql.Request(cp).query(
	// 			query3.format(recordset[0].id, r.employeeSso), 
	// 			function(err){if(err){console.log(err);}}
	// 		);
	// 	}
	// });

	res.redirect('back');
};