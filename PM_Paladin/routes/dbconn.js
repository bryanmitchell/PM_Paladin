var exports = module.exports = {};
var sql = require('mssql');

var sqlConfig = {  
	user: 'paladin_watch',  
	password: 'pmpaladin',  
	server: 'DESKTOP-CRJIBKD\\SQLEXPRESS',
	database: 'paladin'
};

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
	console.log("Gonna connect and run...");
	sql.connect(sqlConfig, function(err){
		if(err){ console.log("Connection to db failed..."); }
		else{ console.log("Connection to db success!"); }

		new sql.Request().query(query, function(err, recordset){
			if(err){ console.log("Query failed: "+query); }
			else{ console.log("Query good!"); }

			console.dir(recordset);
			res.send(recordset);
		})
	});
}

exports.getEmployees = function(type, res){
	console.log("Getting all employees...");
	if (arguments.length < 2) {
		runQuery(`
			SELECT sso, firstName, lastName, email 
			FROM Employee;
			`, res);
	} else {
		runQuery(`
			SELECT e.sso, e.firstName, e.lastName, e.email, et.employeeType 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = '{0}';
			`.format(type), res);
	}
}

exports.getSelectedEmployee = function(req, res){
	console.log("Getting selected employee...");
	runQuery(`
		SELECT e.sso, e.firstName, e.lastName, e.email, et.employeeType 
		FROM Employee AS e 
		INNER JOIN EmployeeType AS et 
		ON e.sso = et.sso 
		WHERE et.employeeType = 'req.body.sso';
		`.format(req), res);
	
}

exports.getPositions = function(res){
	runQuery(`
		SELECT * 
		FROM EmployeeType;
		`, res);
}

/*
SELECT e.sso, e.firstName, e.lastName, e.email, et.employeeType 
			FROM Employee AS e 
			INNER JOIN EmployeeType AS et 
			ON e.sso = et.sso 
			WHERE et.employeeType = "{0}";
			*/