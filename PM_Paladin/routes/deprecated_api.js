/*
	Readers:  Lines, WSs, Tools, Tasks, Employees
	Creators: Tool, Workstation, Line, Employee
	Updaters: Tool, Workstation, Line, Employee
	Deleters: Tool, Workstation, Line, Employee
*/

var sql = require('mssql');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var sqlConfig = {  
	user: 'paladin_watch',  
	password: 'pmpaladin',  
	server: 'LRMM-LENOVO-Y40\\SQLEXPRESS',
	database: 'paladin'
};

createUser(1, "Brian", "Michelle", "bryan.mitchell@upr.edu", "password", "Engineer");

//----------------------------
// UTILITY
//----------------------------

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

function runQuery(query) {
	var conn = new sql.Connection(sqlConfig);
	var req = new sql.Request(conn);

	conn.connect()
	.then(function(err) {
		console.log("Connected to database");
		req.query(query)
		.then(function(recordset) {
			console.log(recordset);
			conn.close();
		})
		.catch(function(err){
			console.log(err);
		})
	})
	.catch(function(err) {
		console.log(err);
	});
}


//----------------------------
// CREATE
//----------------------------

function createLine(){
	console.log("Creating line...");
	runQuery(`
		INSERT INTO ProductionLine () 
		VALUES ({0},'{1}','{2}','{3}','{4}');
		`.format());
}

function createWorkstation(wsId, wsName, greenOpc, yellowOpc, redOpc, empId){
	console.log("Creating workstation...");
	runQuery(`
		INSERT INTO Workstation 
		VALUES ({0}, '{1}', 1, 0, 0, {2}, {3}, {4});
		INSERT INTO WorkstationAssignedTo (workstationId, employeeSso) 
		VALUES ({5},{6});
		`.format(wsId, wsName, greenOpc, yellowOpc, redOpc, wsId, empId));
}

function createTool(toolId, toolType, rfidAddress, opcTag, ioAddress, techId){
	console.log("Creating tool...");
	// TODO Get values from PM Pro
	var toolName;
	var supplier;
	var yearBought;
	var originalCostDollars;
	
	runQuery(`
		INSERT INTO Tool 
		VALUES ({0}, '{1}', '{2}', '{3}', {4}, {5}, {6}, '{7}', '{8}', '{9}');
		`.format(toolId, toolName, toolType, supplier, yearBought, 1, originalCostDollars, rfidAddress, opcTag, ioAddress));
	runQuery(`
		INSERT INTO ToolAssignedTo (toolId, employeeSso) 
		VALUES ({0},{1});
		`.format(toolId, techId));
}

function createEmployee(sso, fName, lName, email, pwd, type){
	console.log("Creating user...");
	runQuery(`
		INSERT INTO Employee (sso, firstName, lastName, email, passwordHash) 
		VALUES ({0},'{1}','{2}','{3}','{4}');
		INSERT INTO EmployeeType 
		VALUES ({5},'{6}');
		`.format(sso,fName,lName,email,bcrypt.hashSync(pwd, salt),sso,type));
}

//----------------------------
// READ
//----------------------------

function getLines(){
	console.log("Getting all production lines...");
	runQuery(`
		SELECT * 
		FROM ProductionLine;
		`);
}

function getWorkstations(){
	console.log("Getting all workstations...");
	runQuery(`
		SELECT * 
		FROM Workstation;
		`);
}

function getTools(){
	console.log("Getting all tools...");
	runQuery(`
		SELECT * 
		FROM Tool AS t 
		INNER JOIN ToolInWorkstation AS tws 
		ON t.toolId = tws.toolId 
		INNER JOIN Workstation AS ws 
		ON tws.workstationId = ws.workstationId 
		INNER JOIN WorkstationInLine AS wsl 
		ON ws.workstationId = wsl.workstationId 
		INNER JOIN ProductionLine AS pl 
		ON wsl.lineId = pl.lineId;
		`);
}

function getTasksByStatus(status, empId){
	console.log('Getting all tasks with status {0}...'.format(status));
	if (typeof empId !== 'undefined') {
		runQuery(`
			SELECT * 
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
			WHERE tsk.taskStatus = '{0}';
			`.format(status));
	}
	else {
		runQuery(`
			SELECT * 
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
			WHERE tsk.taskStatus = '{0}' and emp.sso = {1};
			`.format(status, empId));
	}
}

function getEmployees(type){
	console.log("Getting all employees...");
	if (typeof empId !== 'undefined') {
		runQuery(`
			SELECT * 
			FROM Employees;
			`);
	} else {
		runQuery(`
			SELECT * 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = '{0}';
			`.format(type));
	}
}


//----------------------------
// UPDATE (Tool, Workstation, Line, Employee)
//----------------------------

function updateTool(wsId, wsName, greenOpc, yellowOpc, redOpc, empId){
	console.log("Updating workstation...");
	runQuery(`
		UPDATE Workstation 
		SET workstationName = '{0}', greenLightOpcTag = {1}, greenLightOpcTag = {2}, greenLightOpcTag = {3} 
		WHERE workstationId = {4};
		UPDATE WorkstationAssignedTo 
		SET employeeSso = {4} 
		WHERE workstationId = {5};
		`.format(wsName, greenOpc, yellowOpc, redOpc, wsId, empId, wsId));
}

function updateWorkstation(wsId, wsName, greenOpc, yellowOpc, redOpc, empId){
	console.log("Updating workstation...");
	runQuery(`
		UPDATE Workstation 
		SET workstationName = '{0}', greenLightOpcTag = {1}, greenLightOpcTag = {2}, greenLightOpcTag = {3} 
		WHERE workstationId = {4};
		UPDATE WorkstationAssignedTo 
		SET employeeSso = {4} 
		WHERE workstationId = {5};
		`.format(wsName, greenOpc, yellowOpc, redOpc, wsId, empId, wsId));
}


//----------------------------
// DELETE
//----------------------------
