var LocalStrategy 		= require('passport-local').Strategy;
var FacebookStrategy 	= require('passport-facebook').Strategy;
var configAuth 			= require('./auth');
var User 				= require('../models/user');
var crypto  			= require('crypto');
var request				= require('request');

module.exports = function(passport) {
	
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});
	
	passport.use('local', new LocalStrategy({
			usernameField: 'login',
			passwordField: 'password'
		}, function(login, password, done) {
			User.authenticate(login, password, function(err, user) {
				if (err) return done(err);
				if (!user) return done(null, false);
				return done(null, user);
			});
		}
	));
	
	passport.use(new FacebookStrategy({
			clientID: configAuth.facebookAuth.clientID,
			clientSecret: configAuth.facebookAuth.clientSecret,
			callbackURL: configAuth.facebookAuth.callbackURL,
			profileFields: ['id', 'displayName', 'picture.type(large)', 'emails', 'about']
		}, function(token, refreshToken, profile, done) {
			process.nextTick(function() {
				User.findOne({ 'facebook_id': profile.id }, function(err, user) {
					if (err) return done(err);
					if (user) {
						return done(null, user);
					} else {
						var newUser = new User();
						newUser.facebook_id = profile.id;
						newUser.password = crypto.randomBytes(16).toString('hex');
						newUser.salt = crypto.randomBytes(16).toString('hex');
						newUser.login = profile.displayName.split(' ')[0].toLowerCase() + profile.id;
						newUser.name = profile.displayName;
						newUser.email = profile.emails[0].value;
						if (profile.photos.length > 0) newUser.profile_photo = profile.photos[0].value;
						newUser.save(function(err) {
							if (err) return done(err);
							newUser.profile_photo = undefined;
							return done(null, newUser);
						});
					}
				});
			});
		}
	));
		
	passport.loggedIn = function(req, res, next) {
		if (req.user) {
			next();
		} else {
			res.json({ ok: 0, message: 'Authentication error.' });
		}
	}

};
