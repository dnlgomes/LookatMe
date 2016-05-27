// Import modules
var express      = require('express');
var app          = express();
var bodyParser   = require('body-parser');
var mongoose     = require('mongoose');
var passport     = require('passport');
var auth 		 = require('./app/config/auth');
var expressJwt   = require('express-jwt');
var jwt 	     = require('jsonwebtoken');

require('./app/config/passport')(passport);

// Configurations of middlewares
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(passport.initialize());
//app.use(passport.session());
app.use(express.static(__dirname + '/www'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Access environment variables
var databaseUrl = 'mongodb://localhost:27017/api';
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
    databaseUrl = process.env.OPENSHIFT_MONGODB_DB_URL +
					process.env.OPENSHIFT_APP_NAME;
}
var serverPort   = process.env.OPENSHIFT_NODEJS_PORT || 8083;
var serverIpAddr = process.env.OPENSHIFT_NODEJS_IP || 'localhost';

// Initialize mongoose and models
mongoose.connect(databaseUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error.'));
db.on('open', function() {
	console.log('MongoDB connected at %s...', databaseUrl);
});

// Setup API routes
app.use('/api/users',     require('./app/routes/users'));
app.use('/api/items',     require('./app/routes/items'));
app.use('/api/questions', require('./app/routes/questions'));
app.use('/api/comments',  require('./app/routes/comments'));
app.use('/api/friendships', require('./app/routes/friendships'));
app.use('/api/item_comments', require('./app/routes/item_comments'));

// Initialize the application
app.listen(serverPort, serverIpAddr, function() {
	console.log('%s: Node server started on %s:%d...',
		Date(), serverIpAddr, serverPort);
});
