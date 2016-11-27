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
			if(error) {return next(error);}
			return res.sendStatus(200);
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
			sendEmail(emailgen.partiallyConfirmedEmail(req), res);
		});
	//Full Confirmation Email
	router.route('/emailfull')
		.post(function(req, res){
			sendEmail(emailgen.fullyConfirmedEmail(req), res);
		});
	//Maintenance Approval Email
	router.route('/emailapprove')
		.post(function(req, res){
			sendEmail(emailgen.approvedEmail(req), res);
		});
	//New User Email
	router.route('/emailnewuser')
		.post(function(req, res){
			sendEmail(emailgen.newUserEmail(req), res);
		});

	return router;
};