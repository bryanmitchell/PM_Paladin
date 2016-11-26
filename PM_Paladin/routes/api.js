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
			console.log(response.statusCode);
			console.log(response.body);
			console.log(response.headers);

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
			console.log("router.route(/getEmployeePassword)");
			dbconn.getEmployeePassword(cp, req, res);
		});

	router.route('/gettooldates')
		.get(function(req, res){
			console.log("router.route(/gettooldates)");
			dbconn.getToolDates(cp, res);
		});

	router.route('/getbarchartinfo')
		.get(function(req, res){
			console.log("router.route(/getbarchartinfo)");
			dbconn.getBarChartInfo(cp, res);
		});

	router.route('/getpiechartinfo')
		.get(function(req, res){
			console.log("router.route(/getpiechartinfo)");
			dbconn.getPieChartInfo(cp, res);
		});




	/**
	EQUIPMENT MANAGEMENT
	**/
	// GET
	router.route('/tools')
		.get(function(req, res){
			console.log("router.route(/tools)");
			dbconn.getTools(cp, res);
		});

	router.route('/workstations')
		.get(function(req, res){
			console.log("router.route(/workstations)");
			dbconn.getWorkstations(cp, res);
		});

	router.route('/lines')
		.get(function(req, res){
			console.log("router.route(/lines)");
			dbconn.getLines(cp, res);
		});
	
	// CREATE
	router.route('/createline')
		.post(function(req, res){
			console.log("router.route(/createline)");
			dbconn.createLine(cp, req, res);
		});

	router.route('/createworkstation')
		.post(function(req, res){
			console.log("router.route(/createworkstation)");
			dbconn.createWorkstation(cp, req, res);
		});

	router.route('/createtool')
		.post(function(req, res){
			console.log("router.route(/createtool)");
			dbconn.createTool(cp, req, res);
		});

	// UPDATE
	router.route('/updateline')
		.post(function(req, res){
			console.log("router.route(/updateline)");
			dbconn.updateLine(cp, req, res);
		});

	router.route('/updateworkstation')
		.post(function(req, res){
			console.log("router.route(/updateworkstation)");
			dbconn.updateWorkstation(cp, req, res);
		});

	router.route('/updatetool')
		.post(function(req, res){
			console.log("router.route(/updatetool)");
			dbconn.updateTool(cp, req, res);
		});

	// DELETE
	router.route('/deleteline')
		.post(function(req, res){
			console.log("router.route(/deleteline)");
			dbconn.deleteLine(cp, req, res);
		});

	router.route('/deleteworkstation')
		.post(function(req, res){
			console.log("router.route(/deleteworkstation)");
			dbconn.deleteWorkstation(cp, req, res);
		});
	router.route('/deletetool')
		.post(function(req, res){
			console.log("router.route(/deletetool)");
			dbconn.deleteTool(cp, req, res);
		});

	// TOOL OPERATION
	router.route('/settoolactive')
		.post(function(req, res){
			console.log("router.route(/settoolactive)");
			dbconn.setToolActive(cp, req, res);
		});

	router.route('/settoolinactive')
		.post(function(req, res){
			console.log("router.route(/settoolinactive)");
			dbconn.setToolInactive(cp, req, res);
		});





	/**
	USER MANAGEMENT
	**/
	// Creating Employees
	router.route('/createemployee')
		.post(function(req, res){
			console.log("router.route(/createemployee)");
			dbconn.createEmployee(cp, req, res);
		});

	// Getting Users
	router.route('/employees')
		.get(function(req, res){
			console.log("router.route(/employees)");
			dbconn.getEmployees(cp, res);
		});

	router.route('/updateemployee')
		.post(function(req, res){
			console.log("router.route(/updateemployee)");
			dbconn.updateEmployee(cp, req, res);
		});

	router.route('/deleteemployee')
		.post(function(req, res){
			console.log("router.route(/deleteemployee)");
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
			console.log("router.route(/confirmtasks)");
			dbconn.getConfirmationTasks(cp, req, res);
		});

	router.route('/confirmpartial')
		.post(function(req, res){
			console.log("router.route(/confirmpartial)");
			dbconn.setPartialConfirm(cp, req, res);
		});

	router.route('/confirmfull')
		.post(function(req, res){
			console.log("router.route(/confirmfull)");
			dbconn.setFullConfirm(cp, req, res);
		});





	/**
	MAINTENANCE APPROVAL
	**/
	// Getting tasks that require approval
	router.route('/approvetasks')
		.post(function(req, res){
			console.log("router.route(/approvetasks)");
			dbconn.getApprovalTasks(cp, req, res);
		});

	router.route('/approve')
		.post(function(req, res){
			console.log("router.route(/approve)");
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