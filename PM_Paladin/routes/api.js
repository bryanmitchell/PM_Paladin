module.exports = function(cp){
	var express = require('express');
	var router = express.Router();

	var bcrypt = require('bcryptjs');
	var salt = bcrypt.genSaltSync(10);

	var emailgen = require('./emailgen');
	var dbconn = require('./dbconn');

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
	
	// Getting Users for User Management
	router.route('/employees')
		.get(function(req, res){
			console.log("router.route(/employees)");
			dbconn.getEmployees(cp, res);
		});

	// Getting Tasks that require confirmation (partial or full)
	router.route('/confirmtasks')
		.get(function(req, res){
			console.log("router.route(/confirmtasks)");
			dbconn.getConfirmationTasks(cp, res, 2);
		});

	// Getting tasks that require approval
	router.route('/approvetasks')
		.get(function(req, res){
			console.log("router.route(/approvetasks)");
			dbconn.getApprovalTasks(cp, res, 1);
		});

	// Getting tools and their workstations and lines
	router.route('/tools')
		.get(function(req, res){
			console.log("router.route(/tools)");
			dbconn.getTools(cp, res);
		});

	// Getting workstations and their lines
	router.route('/workstations')
		.get(function(req, res){
			console.log("router.route(/workstations)");
			dbconn.getWorkstations(cp, res);
		});

	// Getting lines
	router.route('/lines')
		.get(function(req, res){
			console.log("router.route(/lines)");
			dbconn.getLines(cp, res);
		});

	// Creating Employees
	router.route('/createemployee')
		.post(function(req, res){
			console.log("router.route(/createemployee)");
			dbconn.createEmployee(cp, req, res);
		});

	// Get Log In Employee
	router.route('/getEmployeePassword')
		.post(function(req, res){
			console.log("router.route(/getEmployeePassword)");
			dbconn.getEmployeePassword(cp, req, res);
		});

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

	/**
	EMAIL ROUTES
	**/

	//Partial Confirmation Email
	router.route('/partial')
		.post(function(req, res){
			sendEmail(emailgen.partiallyConfirmedEmail(req), res);
		});

	//Full Confirmation Email
	router.route('/full')
		.post(function(req, res){
			sendEmail(emailgen.fullyConfirmedEmail(req), res);
		});

	//Maintenance Approval Email
	router.route('/approve')
		.post(function(req, res){
			sendEmail(emailgen.approvedEmail(req), res);
		});

	//New User Email
	router.route('/newUser')
		.post(function(req, res){
			sendEmail(emailgen.newUserEmail(req), res);
		});

	return router;
};