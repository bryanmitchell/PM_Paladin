/**
sendEmailWeeklyReport

Description: JS script to be called through Node.js by Windows Task Scheduler daily at midnight.
	Script updates past due task statuses, tool active bits, 
	and sends email to corresponding technicians and line supervisors.
**/

require('dotenv').config();
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var sql = require('mssql');

/** 
* CREATE CONNECTION TO DB 
**/
var sqlConfig = {
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	server: process.env.SQL_SERVER,
	database: process.env.SQL_DB
};


/** 
* SEND EMAIL: Technicians with upcoming tasks 
**/
// List of technicians
var getTechSsoQuery = `
	SELECT DISTINCT tat.Sso AS [sso]
	FROM [Task] tsk
	INNER JOIN [ToolAssignedTo] tat ON tsk.ToolID = tat.ToolID
	WHERE DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) < 14;`;

// Task details for a given technician
var tecEmailQuery = function(sso) {
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
	INNER JOIN ToolAssignedTo tat ON t.ToolID = tat.ToolID
	INNER JOIN Employee e ON tat.Sso = e.Sso
	WHERE e.Sso = ${sso}
	AND DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) < 14;`;
};

// List of emails
var getBossEmailQuery = `
	SELECT DISTINCT es.Email AS [email]
	FROM [Task] tsk
	INNER JOIN [ToolAssignedTo] tat ON tsk.ToolID = tat.ToolID
	INNER JOIN [Employee] tec ON tat.Sso = tec.Sso
	INNER JOIN [EmployeeSupervisor] es ON tec.Sso = es.Sso 
	WHERE DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) < 14;`;

// Task details for a given technician boss email
var bossEmailQuery = function(email) {
	return `
	SELECT tsk.TaskDescription
		,t.ToolName AS [ToolName]
		,ws.WorkstationName AS [WorkstationName]
		,pl.LineName AS [LineName]
		,es.FirstName AS [FirstName]
		,es.LastName AS [LastName]
		,es.Email AS [Email]
		,DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) AS [DaysLeft]
	FROM Task tsk 
	INNER JOIN Tool t ON tsk.ToolID = t.ToolID
	INNER JOIN Workstation ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN ProductionLine pl ON ws.LineID = pl.LineID
	INNER JOIN ToolAssignedTo tat ON t.ToolID = tat.ToolID
	INNER JOIN Employee e ON tat.Sso = e.Sso
	INNER JOIN [EmployeeSupervisor] es ON tec.Sso = es.Sso 
	WHERE es.Email = '${email}'
	AND DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) < 14;`;
};

var cp = new sql.Connection(sqlConfig, function(err)
{
	if (err){
		console.log("Connection to db failed..."); 
		console.log(err);
	} else {
		cp.connect();
		// Send to process engineers
		new sql.Request(cp).query(getTechSsoQuery, function(err, recordset) {
			if(err) {console.log(err);} 
			else {
				console.log(`Sending ${recordset.length} technician emails...`);
				for(var i=0; i<recordset.length; ++i){
					new sql.Request(cp).query(tecEmailQuery(recordset[i].sso), function(err, recordset2) {
						if(err) { console.log(err); }
						else{
							sendEmail(recordset2);
						}
					});}}});
		//send to technician bosses
		new sql.Request(cp).query(getBossEmailQuery, function(err, recordset) {
			if(err) {console.log(err);} 
			else {
				console.log(`Sending ${recordset.length} boss emails...`);
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
	var subject = "[PM Paladin] Weekly report of upcoming or past due PM tasks"
	var recipient = new helper.Email(recordset[0].Email);
	var header = `This is an automated message.<br><br>`;
	var message = `Hello ${recordset[0].FirstName} ${recordset[0].LastName},<br>
		The following task(s) are due in 2 weeks or less, or already past due, and require preventive maintenance:<br>`;
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