module.exports = function(cp){
	var express = require('express');
	var router = express.Router();

	var emailgen = require('./emailgen');
	var dbconn = require('./dbconn2');

	require('dotenv').config();
	var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

	var sendEmail = function(toSend, res){
		var request = sg.emptyRequest({
			method: 'POST',
			path: '/v3/mail/send',
			body: toSend
		});

		sg.API(request, function(error, response) {
			if(error !== null)  {
				console.log(error);
				console.log(response.statusCode); 
				console.log(response.body);
				console.log(response.headers); 
			}
		});
	};

	/**
	DASHBOARD
	**/
	// Get Log In Employee
	router.route('/getEmployeePassword')
		.post(function(req, res){
			dbconn.getEmployeePassword(cp, req, res);
		});
	router.route('/gettooldates')
		.get(function(req, res){
			dbconn.getToolDates(cp, res);
		});
	router.route('/getbarchartinfo')
		.get(function(req, res){
			dbconn.getBarChartInfo(cp, res);
		});
	router.route('/getpiechartinfo')
		.get(function(req, res){
			dbconn.getPieChartInfo(cp, res);
		});




	/**
	EQUIPMENT MANAGEMENT
	**/
	// GET
	router.route('/tools')
		.get(function(req, res){
			dbconn.getTools(cp, res);
		});
	router.route('/workstations')
		.get(function(req, res){
			dbconn.getWorkstations(cp, res);
		});
	router.route('/lines')
		.get(function(req, res){
			dbconn.getLines(cp, res);
		});
	router.route('/pmprolines')
		.get(function(req, res){
			dbconn.getPmProLines(cp, res);
		});
	router.route('/pmproworkstations')
		.get(function(req, res){
			dbconn.getPmProWorkstations(cp, res);
		});
	router.route('/pmprotools')
		.get(function(req, res){
			dbconn.getPmProTools(cp, res);
		});
	
	// CREATE
	router.route('/createline')
		.post(function(req, res){
			dbconn.createLine(cp, req, res);
		});
	router.route('/createworkstation')
		.post(function(req, res){
			dbconn.createWorkstation(cp, req, res);
		});
	router.route('/createtool')
		.post(function(req, res){
			dbconn.createTool(cp, req, res);
		});
	// UPDATE
	router.route('/updateline')
		.post(function(req, res){
			dbconn.updateLine(cp, req, res);
		});
	router.route('/updateworkstation')
		.post(function(req, res){
			dbconn.updateWorkstation(cp, req, res);
		});
	router.route('/updatetool')
		.post(function(req, res){
			dbconn.updateTool(cp, req, res);
		});

	// DELETE
	router.route('/deleteline')
		.post(function(req, res){
			dbconn.deleteLine(cp, req, res);
		});
	router.route('/deleteworkstation')
		.post(function(req, res){
			dbconn.deleteWorkstation(cp, req, res);
		});
	router.route('/deletetool')
		.post(function(req, res){
			dbconn.deleteTool(cp, req, res);
		});

	// TOOL OPERATION & OTHERS
	router.route('/settoolactive')
		.post(function(req, res){
			dbconn.setToolActive(cp, req, res);
		});
	router.route('/settoolinactive')
		.post(function(req, res){
			dbconn.setToolInactive(cp, req, res);
		});

	router.route('/getscannedrfidtags')
		.get(function(req, res){
			dbconn.getScannedRfidTags(cp, res);
		});




	/**
	USER MANAGEMENT
	**/
	// Creating Employees
	router.route('/createemployee')
		.post(function(req, res){
			dbconn.createEmployee(cp, req, res);
		});
	// Getting Users
	router.route('/employees')
		.get(function(req, res){
			dbconn.getEmployees(cp, res);
		});
	router.route('/updateemployee')
		.post(function(req, res){
			dbconn.updateEmployee(cp, req, res);
		});
	router.route('/deleteemployee')
		.post(function(req, res){
			dbconn.deleteEmployee(cp, req, res);
		});

	/**
	MY TASKS
	**/
	router.route('/gettasks')
		.post(function(req, res){
			console.log("router.route(/gettasks)");
			dbconn.getTasks(cp, req, res);
		});


	/**
	MAINTENANCE CONFIRMATION
	**/
	// Getting Tasks that require confirmation (partial or full)
	router.route('/confirmtasks')
		.post(function(req, res){
			dbconn.getConfirmationTasks(cp, req, res);
		});
	router.route('/confirmpartial')
		.post(function(req, res){
			dbconn.setPartialConfirm(cp, req, res);
		});
	router.route('/confirmfull')
		.post(function(req, res){
			dbconn.setFullConfirm(cp, req, res);
		});





	/**
	MAINTENANCE APPROVAL
	**/
	// Getting tasks that require approval
	router.route('/approvetasks')
		.post(function(req, res){
			dbconn.getApprovalTasks(cp, req, res);
		});
	router.route('/approve')
		.post(function(req, res){
			dbconn.setApprove(cp, req, res);
		});




	/**
	EMAIL ROUTES
	**/
	//Partial Confirmation Email
	router.route('/emailpartial')
		.post(function(req, res){
			// Get distinct SSOs
			var tasks = req.body.tasks;
			var engSsos = []; // just to make list-forming easier
			var engInfo = [];
			var i,j;

			// Form list of engineer SSOs
			for (i=0; i < tasks.length; i++){
				if( engSsos.indexOf(tasks[i].EngSso) == -1){
					engSsos.push(tasks[i].EngSso);
					engInfo.push({'sso': tasks[i].EngSso, 'email': tasks[i].EngEmail});
				}
			}

			// O(n*m)!
			// For each engineer
			for (i=0; i < engInfo.length; i++){ // For each engineer
				var newReq = {'tecName': req.body.tecName, 'engEmail':engInfo[i].email, 'content':''};
				// form list of tasks 
				for (j=0; j < tasks.length; j++){ 
					if (engInfo[i].sso == tasks[j].EngSso){
						newReq.content+=`<li>Line: ${tasks[j].Line}; WS: ${tasks[j].WS}; Tool: ${tasks[j].Tool}; Task: ${tasks[j].Desc}</li>`;
					}
				}
				// And finally send email
				sendEmail(emailgen.partiallyConfirmedEmail(newReq), res);
			}

			console.log(`${engInfo.length} emails sent`);
			var tmp = [];
			for (i=0; i < engInfo.length; i++){tmp.push(engInfo[i].email);}
			res.send({'emails': tmp.join(', ')});
		});
	//Full Confirmation Email
	router.route('/emailfull')
		.post(function(req, res){
			var tasks = req.body.tasks;
			var engSsos = []; // just to make list-forming easier
			var engInfo = [];
			var i,j;
			var err = false;

			// Form list of engineer SSOs
			for (i=0; i < tasks.length; i++){
				if( engSsos.indexOf(tasks[i].EngSso) == -1){
					engSsos.push(tasks[i].EngSso);
					engInfo.push({'sso': tasks[i].EngSso, 'email': tasks[i].EngEmail});
				}
			}
			// O(n*m)!
			// For each engineer
			for (i=0; i < engInfo.length; i++){ // For each engineer
				var newReq = {'tecName': req.body.tecName, 'engEmail':engInfo[i].email, 'content':''};
				// form list of tasks 
				for (j=0; j < tasks.length; j++){ 
					if (engInfo[i].sso == tasks[j].EngSso){
						newReq.content+=`<li>Line: ${tasks[j].Line}; WS: ${tasks[j].WS}; Tool: ${tasks[j].Tool}; Task: ${tasks[j].Desc}</li>`;
					}
				}
				// And finally send email
				if ( !sendEmail(emailgen.fullyConfirmedEmail(newReq), res) ) {err=true;}
			}

			if (!err){
				console.log(`${engInfo.length} emails sent`);
				var tmp = [];
				for (i=0; i < engInfo.length; i++){tmp.push(engInfo[i].email);}
				res.send({'emails': tmp.join(', ')});
			} else {
				res.sendStatus(500);
			}
		});

	//Maintenance Approval Email
	router.route('/emailapprove')
		.post(function(req, res){
			var tasks = req.body.tasks;
			var supervisorEmails = [];
			var i,j; // Counters
			var err = false;
			var response = {};
			// Form response
			var tmp = [];
			for (i=0; i < supervisorEmails.length; i++) {tmp.push(supervisorEmails[i]);}
			response = {'emails': tmp.join(', ')};

			// Form list of engineer SSOs
			for (i=0; i < tasks.length; i++){
				if( supervisorEmails.indexOf(tasks[i].LineSupervisorEmail) == -1){
					supervisorEmails.push(tasks[i].LineSupervisorEmail);
				}
			}

			// O(n*m)!
			// For each engineer
			for (i=0; i < supervisorEmails.length; i++){ // For each engineer
				var newReq = {'engName': req.body.engName, 'supervisorEmail': supervisorEmails[i], 'content': ''};
				// form list of tasks 
				for (j=0; j < tasks.length; j++){ 
					if (supervisorEmails[i] === tasks[j].LineSupervisorEmail){
						newReq.content+=`<li>Line: ${tasks[j].Line}; WS: ${tasks[j].WS}; Tool: ${tasks[j].Tool}; Task: ${tasks[j].Desc}</li>`;
					}
				}
				// And finally send email
				// TODO Error handling for unsent emails, send Error 500
				sendEmail(emailgen.approvedEmail(newReq), res);
			}
			console.log(`${supervisorEmails.length} emails sent`);
			var tmp = [];
			for (i=0; i < supervisorEmails.length; i++){tmp.push(supervisorEmails[i]);}
			res.send({'emails': tmp.join(', ')});
		});
	//New User Email
	router.route('/emailnewuser')
		.post(function(req, res){
			sendEmail(emailgen.newUserEmail(req), res);
			res.sendStatus(200);
		});

	return router;
};