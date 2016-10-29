var express = require('express');
var router = express.Router();

var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var emailgen = require('./emailgen');
var dbconn = require('./dbconn');

// var dotenv = require('dotenv');
// dotenv.load();

var sendgrid_api_key = process.env.SENDGRID_API_KEY;
var sg = require('sendgrid')('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');


router.route('/employees')
	.get(function(req, res){
		console.log("GET");
		dbconn.getEmployees(res);
	});

router.route('/confirmtasks')
	.get(function(req, res){
		console.log("GET");
		dbconn.getConfirmationTasks(res, 1);
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