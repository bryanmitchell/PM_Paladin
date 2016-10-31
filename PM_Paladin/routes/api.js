var express = require('express');
var router = express.Router();

var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var emailgen = require('./emailgen');
var dbconn = require('./dbconn');

require('dotenv').config();
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

// Getting Users for User Management
router.route('/employees')
	.get(function(req, res){
		console.log("router.route(/employees)");
		dbconn.getEmployees(res);
	});

// Getting Tasks that require confirmation (partial or full)
router.route('/confirmtasks')
	.get(function(req, res){
		console.log("router.route(/confirmtasks)");
		dbconn.getConfirmationTasks(res, 2);
	});

// Getting tasks that require approval
router.route('/approvetasks')
	.get(function(req, res){
		console.log("router.route(/approvetasks)");
		dbconn.getApprovalTasks(res, 1);
	});

router.route('/selectedEmployee')
	.get(function(req, res){
		console.log("GET");
		dbconn.getSelectedEmployee(req, res);
	});

// Getting tools and their workstations and lines
router.route('/tools')
	.get(function(req, res){
		console.log("router.route(/tools)");
		dbconn.getTools(res);
	});

// Getting workstations and their lines
router.route('/workstations')
	.get(function(req, res){
		console.log("router.route(/workstations)");
		dbconn.getWorkstations(res);
	});

// Getting lines
router.route('/lines')
	.get(function(req, res){
		console.log("router.route(/lines)");
		dbconn.getLines(res);
	});

// Creating Employees
router.route('/createemployee')
	.post(function(req, res){
		console.log("router.route(/lines)");
		dbconn.createEmployee(req, res);
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

module.exports = router;


function sendEmail(toSend, res){
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
}