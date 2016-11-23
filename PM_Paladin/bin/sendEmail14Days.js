// 14, 7, 3, 2, 1, 0
// weekly partial and past due

if(process.argv.length !== 3){
	throw "Please call 'node sendEmail n', where n is the number of days left to send email";
} else {
	var daysLeft = process.argv[2];
}

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
var cp = new sql.Connection(sqlConfig, function(err){
	if (err){
		console.log("Connection to db failed..."); 
		console.log(err);
	} else {
		console.log("Connection to db success!"); 
		cp.connect();
	}
});

/** GET RECIPIENT EMPLOYEES **/
// pl ⋈ WS ⋈ tool ⋈ tsk ⋈ wat ⋈ eng ⋈ tat ⋈ tec
var query = `
	SELECT pl.LineName,
		ws.WorkstationName,
		t.ToolName,
		
	FROM ProductionLine pl
	INNER JOIN Workstation ws 
	ON pl.LineID = ws.LineID
	INNER JOIN [Tool] t
	ON t.WorkstationID = ws.WorkstationID
	INNER JOIN [Task] tsk 
	ON tsk.ToolID = t.ToolID
	INNER JOIN [WorkstationAssignedTo] wat 
	ON wat.WorkstationID = ws.WorkstationID
	INNER JOIN [Employee] eng
	ON eng.Sso = wat.Sso
	INNER JOIN [ToolAssignedTo] tat 
	ON tat.WorkstationID = t.ToolID
	INNER JOIN (
		SELECT *
		FROM [Employee] tec2
		INNER JOIN EmployeeSupervisor es 
		ON tec2.Sso = es.Sso
	) tec
	ON tec.Sso = tat.Sso
	WHERE tsk.TaskStatus = 'OnTime'
	AND DATEDIFF(day, GETDATE(), DATEADD(day,tsk.[FrequencyDays],tsk.[LastCompleted])) = ${daysLeft}
	`; // TODO
new sql.Request(cp).query(query, function(err, recordset) {
	if(err) {
		console.log(err);
	} else {
		console.log("Query success!");
		for(var i = 0; i<recordset.length; i++){
			sendEmail(recordset[i]);
		}
	}
});

/** SEND EMAIL **/
var sendEmail = function(record) {
	var helper = sg.mail;
	var author = new helper.Email(process.env.EMAIL_AUTHOR);
	var recipient = new helper.Email(record.Email);
	var header = `This is an automated message.
		<br><br>`;
	var content = new helper.Content("text/html", message);
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