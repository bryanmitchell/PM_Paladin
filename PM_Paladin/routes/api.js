var express = require('express');
var router = express.Router();

var sql = require('mssql');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

// var dotenv = require('dotenv');
// dotenv.load();

var sendgrid_api_key = process.env.SENDGRID_API_KEY;
var sg = require('sendgrid')('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');


var sqlConfig = {  
	user: 'paladin_watch',  
	password: 'pmpaladin',  
	server: 'LRMM-LENOVO-Y40\\SQLEXPRESS',
	database: 'paladin'
};


router.route('/employees')
	.post(function(req, res){
		console.log("POST");
		getEmployees("Engineer", res);
	})
	.get(function(req, res){
		console.log("GET");
		getEmployees("Engineer", res);
	})

router.route('/email')
	.post(function(req, res){
		console.log("GET email");
		console.log(req.body);
		// var recordset = {};

		// iterate through JSON to get objects
		// for (var key in req.body) {
		// 	if (req.body.hasOwnProperty(key)) {
		// 		item = req.body[key];
		// 		console.log(item);
		// 		console.log(item.toolID);
		// 	}
		// }
		send(partiallyConfirmedEmail(req), res);
	})

module.exports = router;


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

function runQuery(query, res) {
	sql.connect(sqlConfig, function(err){
		new sql.Request().query(query, function(err, recordset){
			console.dir(recordset);
			res.send(recordset);
		})
	});
}

function getEmployees(type, res){
	console.log("Getting all employees...");
	if (typeof type !== 'undefined') {
		runQuery(`
			SELECT * 
			FROM Employee;
			`, res);
	} else {
		runQuery(`
			SELECT * 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = '{0}';
			`.format(type), res);
	}
}



function send(toSend, res){
	console.log("send");
	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: toSend
	});

	sg.API(request, function(error, response) {

		console.log(response.statusCode)
		console.log(response.body)
		console.log(response.headers)

		if(error) {
			return next(error);
		}
		return res.sendStatus(200);
		

	});
}


function partiallyConfirmedEmail(req){
	var helper = require('sendgrid').mail;

	var content_1 = "This is an automated message.";
	var content_2 = "The following tasks have been partially confirmed: ";
	var index = 0;
	var toolIDs = [];

	//Parse JSON for keys and values
	for (var key in req.body) {
		if (req.body.hasOwnProperty(key)) {
			item = req.body[key];
			toolIDs[index] = "<li>" + item.toolID + "</li>";
			console.log(toolIDs);
			index++;
		}
	};


	from_email = new helper.Email("bryan.bmf@gmail.com");
	to_email = new helper.Email("bryan.bmf@gmail.com");
	subject = "Hello from PM Paladin";
	content = new helper.Content("text/html", content_1 + "<br><br>" + content_2 + "<br>" + "<ul>" + toolIDs.join('') + "</ul>");
	mail = new helper.Mail(from_email, subject, to_email, content);


	//add multiple recipients
	// email = new helper.Email("karla.valcarcel@gmail.com");
	// mail.personalizations[0].addTo(email);

	return mail.toJSON();
} 