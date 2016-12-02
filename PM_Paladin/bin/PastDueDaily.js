/**
sendEmailPastDueDaily

Description: JS script to be called through Node.js by Windows Task Scheduler daily at midnight.
	Script updates past due task statuses, tool active bits, 
	and sends email to corresponding technicians and line supervisors.

	PastDueDaily.bat calls PastDueDaily.js, 
		which calls PastDueDailySQL.bat, 
		which runs PastDueDaily.sql,
		which updates task statuses and activity bits
**/

require('dotenv').config();
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var sql = require('mssql');


var sqlConfig = {
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	server: process.env.SQL_SERVER,
	database: process.env.SQL_DB
};


// List of technicians
var getTecSsoQuery = `
	SELECT DISTINCT tat.Sso AS [sso]
	FROM [Task] tsk
	INNER JOIN [ToolAssignedTo] tat ON tsk.ToolID = tat.ToolID
	WHERE DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) = 0;`;

// Task details for a given technician
var tecEmailQuery = function(sso) {
	return `
	SELECT tsk.TaskDescription
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
	AND DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) = 0;`;
};

// List of Production Line supervisors
var getLineSupEmailQuery = `
	SELECT DISTINCT pl.SupervisorEmail AS [email]
	FROM [Task] tsk
	INNER JOIN Tool t ON tsk.ToolID = t.ToolID
	INNER JOIN Workstation ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN ProductionLine pl ON ws.LineID = pl.LineID
	WHERE DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) = 0;`;

// Task details for a given line supervisor
var lineSupEmailQuery = function(email) {
	return `
	SELECT tsk.TaskDescription
		,t.ToolName
		,ws.WorkstationName
		,pl.LineName
		,pl.SupervisorFirstName AS [FirstName]
		,pl.SupervisorLastName AS [LastName]
		,pl.SupervisorEmail AS [Email]
	FROM Task tsk 
	INNER JOIN Tool t ON tsk.ToolID = t.ToolID
	INNER JOIN Workstation ws ON t.WorkstationID = ws.WorkstationID
	INNER JOIN ProductionLine pl ON ws.LineID = pl.LineID
	WHERE pl.SupervisorEmail = '${email}'
	AND DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) = 0;`;
};

var path = process.env.PROJECT_PATH;
const exec = require('child_process').exec;
exec(path + 'bin\\PastDueDailySQL.bat', (err, stdout, stderr) => {
	if (err) { console.error(err); return; }
	else{
		console.log('Updated DB, now sending emails...');
		var cp = new sql.Connection(sqlConfig, function(err)
		{
			if (err){
				console.log("Connection to db failed..."); 
				console.log(err);
			} else {
				cp.connect();
				// Get technicians with past due tools and send each an email
				new sql.Request(cp).query(getTecSsoQuery, function(err, recordset) {
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
				// Get line supervisors and send each an email
				new sql.Request(cp).query(getLineSupEmailQuery, function(err, recordset) {
					if(err) {console.log(err);} 
					else {
						console.log(`Sending ${recordset.length} line supervisor emails...`);
						for(var i=0; i<recordset.length; ++i){
							new sql.Request(cp).query(lineSupEmailQuery(recordset[i].email), function(err, recordset2) {
								if(err) { console.log(err); }
								else{
									sendEmail(recordset2);
								}
							});}}});
			}
		});
	}
});


/** SEND EMAIL **/
var sendEmail = function(recordset) {
	console.log(`Sending email to ${recordset[0].Email} from ${process.env.EMAIL_AUTHOR}`);
	var helper = require('sendgrid').mail;
	var author = new helper.Email(process.env.EMAIL_AUTHOR);
	var subject = "[PM Paladin] Past Due notification, tools have been turned off."
	var recipient = new helper.Email(recordset[0].Email);
	var header = `This is an automated message.<br><br>`;
	var message = `Hello ${recordset[0].FirstName} ${recordset[0].LastName},<br>
		The following task(s) entered Past Due status. Corresponding tools will be turned off until maintenance is performed.<br>`;
	for(var i = 0; i<recordset.length; ++i) {
		message += `<li>Line: ${recordset[i].LineName} - WS: ${recordset[i].WorkstationName} - Tool: ${recordset[i].ToolName} - Task: ${recordset[i].TaskDescription}</li>`;
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
		else{console.log(`Sent email to ${recordset[0].Email} from ${process.env.EMAIL_AUTHOR}`);}
	});
};
