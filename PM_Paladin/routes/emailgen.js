/***
TODO Eventually, to and from addresses should come from req

***/

var exports = module.exports = {};

function formEmail(req, from_address, to_address, subject, cont){
	var helper = require('sendgrid').mail;

	var header = "This is an automated message.<br><br>";
	from_email = new helper.Email(from_address);
	to_email = new helper.Email(to_address);
	content = new helper.Content("text/html", header+cont);
	mail = new helper.Mail(from_email, subject, to_email, content);

	return mail.toJSON();
} 

exports.partiallyConfirmedEmail = function(req){
	var header = "The following tasks have been partially confirmed: <br>";
	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.engEmail, 
		`[PM Paladin] Tasks have been partially confirmed by technician ${req.tecName}.`,
		header + req.content
	);
};

exports.fullyConfirmedEmail = function(req){
	var header = "The following tasks have been fully confirmed: ";
	var footer = "After inspecting the tool, go to the Maintenance Approval page for final approval.";

	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.engEmail, 
		`[PM Paladin] Tasks have been partially confirmed by technician ${req.tecName}.`,
		header + req.content + "<br>" + footer
	);
};

exports.approvedEmail = function(req){
	var header = "The following tasks have been approved: <br>";

	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.supervisorEmail, 
		`[PM Paladin] Tasks have been approved by engineer ${req.engName}.`,
		header + req.content
	);
};

exports.newUserEmail = function(req){
	var content_1 = "Hi " + req.body.firstName + ", <br><br>  You are now able to access PM Paladin by logging in with your SSO through the web application _______.";

	return formEmail(req, 
		"bryan.bmf@gmail.com", 
		req.body.email, 
		"[PM Paladin] Welcome to PM Paladin!",
		content_1
		);
};


//Upcoming
/* Title: [PM Paladin] Tasks with upcoming maintenance due dates.
	Body: listado

*/ 


