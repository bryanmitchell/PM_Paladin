//passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
// pass connection pool
var dbconn = require('./dbconn');
var bcrypt = require('bcryptjs');
require('dotenv').config();

// expose this function to our app using module.exports
module.exports = function(cp, passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user.sso);
	});

	// used to deserialize the user
	passport.deserializeUser(function(userId, done) {
		query = `SELECT e.sso AS [sso]
				,e.firstName AS [firstName]
				,e.lastName AS [lastName]
				,e.email AS [email]
				,typeList.types AS [types] 
			FROM Employee e 
			WHERE e.sso = ${userId};`;
		new sql.Request(cp).query(query, function(err, recordset){
			done(err, recordset[0]);
		});
	});

	// here it begins
	passport.use('local-login', 
		new LocalStrategy(
			{
				usernameField : 'sso',
				passwordField : 'passwordHash',
				passReqToCallback : true // allows us to pass back the entire request to the callback
			},
			function(req, username, password, done) { // callback with email and password from our form
				query = `SELECT e.sso AS [sso], e.passwordHash AS [passwordHash] 
					FROM Employee e 
					WHERE e.sso = ${username};`;
				new sql.Request(cp).query(query, function(err, recordset){
					//handle error
					if (err) {return done(err);}

					// No user found
					if (!recordset.length) {
						return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
					}

					// user found but password is wrong
					if (!( recordset[0].passwordHash == bcrypt.hashSync(password, process.env.SALT)))
						return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

					// all is well, return successful user
					return done(null, recordset[0]);
					console.log('logged');
				});
			}));
};