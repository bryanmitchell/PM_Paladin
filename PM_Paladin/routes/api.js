module.exports = function(cp, passport){
	var express = require('express');
	var router = express.Router();

	var bcrypt = require('bcryptjs');
	var salt = bcrypt.genSaltSync(10);

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

	var isLoggedIn = function(req, res, next) {
		if (req.isAuthenticated())
			return next(); // if user authenticated in the session, carry on
		res.redirect('/'); // if they aren't redirect them to the home page
	};
	
	router.route('/login')
		.post(passport.authenticate('local-login', {
				successRedirect : '/', // redirect to the secure profile section
				failureRedirect : '/', // redirect back to the signup page if there is an error
				failureFlash : true // allow flash messages
			}),
			function(req, res){
				if (req.body.remember) {
					req.session.cookie.maxAge = 1000 * 60 * 3;
				} else {
					req.session.cookie.expires = false;
				}
				res.redirect('/');
			});

	router.route('/logout')
		.get(function(req, res) {
			req.logout();
			res.redirect('/');
		});

	// Getting Users for User Management
	router.route('/employees')
		.get(function(req, res){
			console.log("router.route(/employees)");
			dbconn.getEmployees(cp, res);
		});

	// Getting Tasks that require confirmation (partial or full)
	router.route('/confirmtasks')
		.post(function(req, res){
			console.log("router.route(/confirmtasks)");
			dbconn.getConfirmationTasks(cp, req, res);
		});

	// Getting tasks that require approval
	router.route('/approvetasks')
		.get(function(req, res){
			console.log("router.route(/approvetasks)");
			dbconn.getApprovalTasks(cp, req, res);
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

	router.route('/updateemployee')
		.post(function(req, res){
			console.log("router.route(/updateemployee)");
			dbconn.updateEmployee(cp, req, res);
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