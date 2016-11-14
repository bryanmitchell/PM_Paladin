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
	var content_1 = "The following tasks have been partially confirmed: ";

	//Parse JSON for keys and values
	var index = 0;
	var toolIDs = [];
	var technicianName = "";
	for (var key in req.body.task) {
		if (req.body.task.hasOwnProperty(key)) {
			item = req.body.task[key];
			toolIDs[index] = "<li>Line: " + item.Line + " - WS: " + item.WS + " - Tool: " + item.Tool + " - Task: " + item.Task + "</li>";
			technicianName = item.TecFName + " " + item.TecLName;
			console.log(toolIDs);
			index++;    
		}
	};
	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.body.engineerEmail, 
		"[PM Paladin] Tasks have been partially confirmed by technician " + technicianName + ".",
		content_1 + "<br>" + "<ul>" + toolIDs.join('') + "</ul>"
		);
};

exports.fullyConfirmedEmail = function(req){
	var content_2 = "The following tasks have been fully confirmed: ";
	var content_3 = "After inspecting the tool, go to the Maintenance Approval page for final approval.";

	//Parse JSON for keys and values
	var index = 0;
	var toolIDs = [];
	var technicianName = "";
	for (var key in req.body.task) {
		if (req.body.task.hasOwnProperty(key)) {
			item = req.body.task[key];
			toolIDs[index] = "<li>Line: " + item.Line + " - WS: " + item.WS + " - Tool: " + item.Tool + " - Task: " + item.Task + "</li>";
			technicianName = item.TecFName + " " + item.TecLName;
			console.log(toolIDs);
			index++;
		}
	};

	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.body.engineerEmail, 
		"[PM Paladin] Tasks have been fully confirmed by technician " + technicianName + ".",
		content_2 + "<br>" + "<ul>" + toolIDs.join('') + "</ul>" + "<br>" + content_3
		);
};

exports.approvedEmail = function(req){
	var content_2 = "The following tasks have been approved: ";
	
	// Parse JSON for keys and values
	var index = 0;
	var toolIDs = [];
	var engineerName = "";
	for (var key in req.body.task) {
		if (req.body.task.hasOwnProperty(key)) {
			item = req.body.task[key];
			toolIDs[index] = "<li>Line: " + item.Line + " - WS: " + item.WS + " - Tool: " + item.Tool + " - Task: " + item.Task + "</li>";
			engineerName = item.EngFName + " " + item.EngLName;
			// console.log(supervisorEmail);
			index++;
		}
	};

	return formEmail(req, 
		"luisr.murphy@gmail.com", 
		req.body.supervisorEmail, 
		"[PM Paladin] Tasks have been approved by engineer " + engineerName + ".",
		content_2 + "<br>" + "<ul>" + toolIDs.join('') + "</ul>"
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


