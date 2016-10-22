var express = require('express');
var router = express.Router();

var sql = require('mssql');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var sqlConfig = {  
	user: 'paladin_watch',  
	password: 'pmpaladin',  
	server: 'LRMM-LENOVO-Y40\\SQLEXPRESS',
	database: 'paladin'
};


router.route('/employees')
	.post(function(req, res){
		console.log("POST");
		getEmployees("Engineer", res);
	})
	.get(function(req, res){
		console.log("GET");
		getEmployees("Engineer", res);
	})


module.exports = router;


//----------------------------
// UTILITY
//----------------------------

// https://journalofasoftwaredev.wordpress.com/2011/10/30/replicating-string-format-in-javascript/
String.prototype.format = function()
{
	var content = this;
	for (var i=0; i < arguments.length; i++)
	{
		var replacement = '{' + i + '}';
		content = content.replace(replacement, arguments[i]);  
	}
	return content;
};

function runQuery(query, res) {
	sql.connect(sqlConfig, function(err){
		new sql.Request().query(query, function(err, recordset){
			console.dir(recordset);
			res.send(recordset);
		})
	});
}

function getEmployees(type, res){
	console.log("Getting all employees...");
	if (typeof type !== 'undefined') {
		runQuery(`
			SELECT * 
			FROM Employee;
			`, res);
	} else {
		runQuery(`
			SELECT * 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = '{0}';
			`.format(type), res);
	}
}