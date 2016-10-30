var express = require('express');
var router = express.Router();

var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var emailgen = require('./emailgen');
var dbconn = require('./dbconn');

require('dotenv').config();
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);


router.route('/employees')
	.get(function(req, res){
		console.log("router.route(/employees");
		dbconn.getEmployees(res);
	});

router.route('/confirmtasks')
	.get(function(req, res){
		console.log("router.route(/confirmtasks");
		dbconn.getConfirmationTasks(res, 2);
	});

router.route('/approvetasks')
	.get(function(req, res){
		console.log("router.route(/approvetasks");
		dbconn.getApprovalTasks(res, 1);
	});

router.route('/selectedEmployee')
	.get(function(req, res){
		console.log("GET");
		dbconn.getSelectedEmployee(req, res);
	});

router.route('/positions')
	.get(function(req, res){
		console.log("GET");
		dbconn.getPositions(res);
	});

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