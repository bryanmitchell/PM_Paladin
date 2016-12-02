/**
PARTIAL WEEKLY

Description: JS script to be called through Node.js by Windows Task Scheduler every Monday at midnight.
	Script obtains SSOs of process engineers whose workstations have at least one partially confirmed task,
	and the email address of the boss of the technicians in charge of said tasks.
	It sends a list of the partially confirmed tasks to them all.
**/

require('dotenv').config();
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var sql = require('mssql');

/** CREATE CONNECTION TO DB **/
var sqlConfig = {
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	server: process.env.SQL_SERVER,
	database: process.env.SQL_DB
};

/** GET RECIPIENT EMPLOYEES **/
// Query to obtain SSOs of engineers who have tools with partial tasks
var getEngSsoQuery = `
	SELECT DISTINCT wat.Sso AS [sso]
	FROM [Task] tsk
	INNER JOIN Tool t ON tsk.ToolID = t.ToolID
	INNER JOIN Workstation ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN [WorkstationAssignedTo] wat ON ws.WorkstationID = wat.WorkstationID
	WHERE tsk.TaskStatus = 'ConfirmPartial';`;

// Query to obtain list of tasks for a given Engineer SSO
var engEmailQuery = function(sso) {
	return `
	SELECT tsk.TaskDescription AS [TaskDescription]
		,t.ToolName AS [ToolName]
		,ws.WorkstationName AS [WorkstationName]
		,pl.LineName AS [LineName]
		,e.FirstName AS [FirstName]
		,e.LastName AS [LastName]
		,e.Email AS [Email]
	FROM Task tsk 
	INNER JOIN Tool t ON tsk.ToolID = t.ToolID
	INNER JOIN Workstation ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN ProductionLine pl ON ws.LineID = pl.LineID
	INNER JOIN WorkstationAssignedTo wat ON t.WorkstationID = wat.WorkstationID
	INNER JOIN Employee e ON wat.Sso = e.Sso
	WHERE e.Sso = ${sso}
	AND tsk.TaskStatus = 'ConfirmPartial';`;
};

// Query to obtain emails of technician bosses whose underlings have partially confirmed tools
var getBossEmailQuery = `
	SELECT DISTINCT es.Email AS [email]
	FROM [Task] tsk
	INNER JOIN [ToolAssignedTo] tat ON tsk.ToolID = tat.ToolID
	INNER JOIN [Employee] tec ON tat.Sso = tec.Sso
	INNER JOIN [EmployeeSupervisor] es ON tec.Sso = es.Sso 
	WHERE tsk.TaskStatus = 'ConfirmPartial';`;

var bossEmailQuery = function(email) {
	return `
	SELECT tsk.TaskDescription AS [TaskDescription]
		,t.ToolName AS [ToolName]
		,ws.WorkstationName AS [WorkstationName]
		,pl.LineName AS [LineName]
		,es.FirstName AS [FirstName]
		,es.LastName AS [LastName]
		,es.Email AS [Email]
	FROM [Task] tsk 
	INNER JOIN [Tool] t ON tsk.ToolID = t.ToolID
	INNER JOIN [Workstation] ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN [ProductionLine] pl ON ws.LineID = pl.LineID
	INNER JOIN [ToolAssignedTo] tat ON t.ToolID = tat.ToolID
	INNER JOIN [Employee] e ON tat.Sso = e.Sso
	INNER JOIN [EmployeeSupervisor] es ON tec.Sso = es.Sso 
	WHERE es.Email = '${email}'
	AND tsk.TaskStatus = 'ConfirmPartial';`;
};


var cp = new sql.Connection(sqlConfig, function(err)
{
	if (err){
		console.log("Connection to db failed..."); 
		console.log(err);
	} else {
		cp.connect();
		// Send to process engineers
		new sql.Request(cp).query(getEngSsoQuery, function(err, recordset) {
			if(err) {console.log(err);} 
			else {
				console.log(`Sending ${recordset.length} technician emails...`);
				for(var i=0; i<recordset.length; ++i){
					new sql.Request(cp).query(engEmailQuery(recordset[i].sso), function(err, recordset2) {
						if(err) { console.log(err); }
						else{
							sendEmail(recordset2);
						}
					});}}});
		//send to technician bosses
		new sql.Request(cp).query(getBossEmailQuery, function(err, recordset) {
			if(err) {console.log(err);} 
			else {
				console.log(`Sending ${recordset.length} line supervisor emails...`);
				for(var i=0; i<recordset.length; ++i){
					new sql.Request(cp).query(bossEmailQuery(recordset[i].email), function(err, recordset2) {
						if(err) { console.log(err); }
						else{
							sendEmail(recordset2);
						}
					});}}});
	}
});


/** SEND EMAIL **/
var sendEmail = function(recordset) {
	var helper = require('sendgrid').mail;
	var author = new helper.Email(process.env.EMAIL_AUTHOR);
	var recipient = new helper.Email(recordset[0].Email);
	var header = `This is an automated message.<br><br>`;
	var message = `Hello ${recordset[0].FirstName} ${recordset[0].LastName},<br>
		This is a reminder that the following tasks have been partially confirmed by a technician and should be attended to as soon as possible:<br>`;
	for(var i = 0; i<recordset.length; ++i) {
		message += `<li>Line: ${recordset[i].LineName} - WS: ${recordset[i].WorkstationName} - Tool: ${recordset[i].ToolName} - Task: ${recordset[i].TaskDescription} - Days Left: ${recordset[i].DaysLeft}</li>`;
	}
	var content = new helper.Content("text/html", header+message);
	var mail = new helper.Mail(author, subject, recipient, content);

	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON()
	});

	sg.API(request, function(error, response) {
		if(error) { console.log(error); }
	});
};