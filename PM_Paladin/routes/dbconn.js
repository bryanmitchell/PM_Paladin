var exports = module.exports = {};
var sql = require('mssql');

var sqlConfig = {  
	user: 'paladin_watch',  
	password: 'pmpaladin',  
	server: 'LRMM-LENOVO-Y40\\SQLEXPRESS',
	database: 'paladin'
};

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

function runQuery(query, res) {
	console.log("Gonna connect and run...");
	sql.connect(sqlConfig, function(err){
		if(err){ console.log("Connection to db failed..."); }
		else{ console.log("Connection to db success!"); }

		new sql.Request().query(query, function(err, recordset){
			if(err){ console.log("Query failed: "+query); }
			else{ console.log("Query good!"); }

			console.dir(recordset);
			res.send(recordset);
		})
	});
};

// Displayed in User Management
exports.getEmployees = function(res){
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
		`, res);
};

// Task list displayed in Maintenance Confirmation
exports.getConfirmationTasks = function(res, empSso){
	// http://stackoverflow.com/questions/63447/how-to-perform-an-if-then-in-an-sql-select
	// TO TEST STILL!!!
	console.log("Getting confirmation tasks...");
	runQuery(`
		SELECT tsk.taskId AS [Task], tsk.taskDescription AS [Desc], t.toolName AS [Tool], ws.workstationName AS [WS], pl.lineName AS [Line],
			CAST(CASE 
				WHEN tsk.taskStatus = 'ConfirmPartial') THEN 'Y' 
				ELSE 'N' 
				END AS CHAR) AS [Partial] 
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
		INNER JOIN Employee AS emp 
		ON tat.employeeSso = emp.sso 
		WHERE (tsk.taskStatus = 'ConfirmPending' OR tsk.taskStatus = 'ConfirmPartial') 
		AND emp.sso = {0};
		`.format(empSso), res);
};

exports.getSelectedEmployee = function(req, res){
	console.log("Getting selected employee...");
	runQuery(`
		SELECT e.sso, e.firstName, e.lastName, e.email, et.employeeType 
		FROM Employee AS e 
		INNER JOIN EmployeeType AS et 
		ON e.sso = et.sso 
		WHERE et.employeeType = 'req.body.sso';
		`.format(req), res);
};

exports.getPositions = function(res){
	runQuery(`
		SELECT * 
		FROM EmployeeType;
		`, res);
};

/*
SELECT e.sso, e.firstName, e.lastName, e.email, et.employeeType 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = "{0}";
			*/