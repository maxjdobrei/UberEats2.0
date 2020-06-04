//Max Dobrei

const fs = require("fs");
const express = require("express");
const app = express();
const ejs = require("ejs");
const session = require("express-session");
const mc = require("mongodb").MongoClient;
const MongoDBStore = require('connect-mongodb-session')(session);
const ObjectId= require('mongoose').Types.ObjectId;

let restaurants = [];



const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/',
  collection: 'sessiondata'
});

//setting the template
app.set("view engine", "ejs");
app.set("views", "./templates");

app.use(session({ secret: 'a super secret key that no one will ever guess', store: store }))
let db;

//helpful arrays for dealing with the header links later, based on whether your logged in or not
let header1Arr = [ 
			{title: "Home Page", lnk: "/", id: "hID" },
			{title: "Users", lnk: "/users", id: "uID" },
			{title: "Register as New User", lnk: "/newuser", id: "nuID" }
		];

let header2Arr = [ 
			{title: "Home Page", lnk: "/", id: "hID" },
			{title: "Users", lnk: "/users", id: "uID" },
			{title: "Ordering Page", lnk: "/orders", id: "oID" }
		];


//render the homepage
function deliverHome(req, res, next)
{
	if (!req.session.loggedin)
	{
		let lnkArr = Array.from(header1Arr);
		let loggedin = false;
		
		res.render("./pages/home", {lnkArr,loggedin });
	}
	else
	{
		let lnkArr = Array.from(header2Arr);
		lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
		lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
		let loggedin = true;
		res.render("./pages/home", {lnkArr, loggedin});
	}
}

//once the new user form has been submitted, this function will handle adding the new user to the database
function registerNewUser(req, res, next)
{
	if (!req.body.username || !req.body.password)
	{	
		res.status(400).send("Error;");
		return;
	}
	db.collection("users").findOne({username: req.body.username}, function (err, result)
	{
		if (!result)
		{
			 //no other person with this username was found
			db.collection("users").insertOne({username: req.body.username, password: req.body.password, privacy: false});
		}
		else
		{
			 //username already taken, render page again with an alert
			let lnkArr = Array.from(header1Arr);
			let alert = true;
			res.render("./pages/registerUser", {lnkArr, alert});
			res.end();
			//dont want the rest of the fnxn to execute
			return;
		}
		//if the new user has been inserted into the database successfully, now we should be able to find them in a query
		db.collection("users").findOne({username: req.body.username}, function (err, result)
		{	
			if (!result)
				return;

			req.session.username = result.username;
			req.session.uid = result._id;
			req.session.loggedin = true;

			res.redirect("/users/" +result._id);

		});
	});
}


//renders the user directory page
function serveUsers(req, res, next)
{
	let lnkArr;
	let loggedin;
	if (!req.session.loggedin)
	{
		lnkArr = Array.from(header1Arr);
		loggedin = false;
	}
	else
	{
		lnkArr = Array.from(header2Arr);
		lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
		lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
		loggedin = true;
	}
	
	let userArr = [];
	db.collection("users").find({privacy: false}, function(err, result)
	{
		result.toArray(function(err, arr)
		{
			//now have an array of all the users that match the request
			let userArr = [];
			arr.forEach(user =>
			{
				let newU = {};
				newU.lnk = "/users/" + user._id;
				newU.title = user.username;
				userArr.push(newU);
			});

			res.render("./pages/users", {lnkArr, userArr, loggedin});
		});
			
	});
}


//render the order form
function serveOrder(req, res, next)
{
	let lnkArr = Array.from(header2Arr);
	lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
	lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
	res.render("./pages/orderform", {lnkArr});
}

//this function will handle adding the new order data into the database
function saveNewOrder(req, res, next)
{
	//being sent the entire order object thx to express json parsing middleware
	
	let order = req.body;			
	let dbO = {};
	dbO.username = req.session.username;
	dbO.restaurant = order.restaurantName;
	dbO.subtotal = order.subtotal;
	dbO.tax = order.tax;
	dbO.delivery = order.fee;
	dbO.total = order.total;
	dbO.order = [];
		
	Object.keys(order.order).forEach(key =>
	{
		let str = key + " x " + order.order[key+""].quantity;
		dbO.order.push(str);
	});	
	db.collection("orders").insertOne(dbO);
	
	res.status(200).send("order placed");
}


//rendering a specific orders page
function getOrder(req, res, next)
{
	if (!req.params.orderId)
		return;

	let tempId;
	try
	{
		tempId = new ObjectId(req.params.orderId);
	}
	catch(err)
	{
		res.status(404).send("Order ID " + req.params.orderId + " does not exist.");
		return;
	}
	db.collection("orders").findOne({_id: tempId }, function(err, result)
		{
			if (!result)
			{
				res.status(404).send("Error. Order does not exist.");
				return;
			}

			db.collection("users").findOne({username: result.username}, function(err, user)
			{
				let lnkArr;
				let loggedin;
				let dbO = result;
				if (user.privacy && req.session.username == user.username)
				{	
					loggedin = true;
					lnkArr = Array.from(header2Arr);
					lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
					lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
					res.render("./pages/orderPage", {lnkArr, loggedin, dbO});
				

				}
				else if (user.privacy)
				{
					res.status(403).send("Error. The user who sent this order has their profile set to private. If this is your profile, please login first and try again.");
				}
				else
				{
					if (req.session.loggedin)
					{	
						loggedin = true;
						lnkArr = Array.from(header2Arr);
						lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
						lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
				
					}
					else
					{
						loggedin = false;
						lnkArr = Array.from(header1Arr);
					}
					
					res.render("./pages/orderPage", {lnkArr, loggedin, dbO});
				}
			});
		});
}


//this handles rendering the user directory page if/when theres a query parameter
function queryParser(req, res, next)
{
	if (!req.query.name)
	{
		next();
	}
	else
	{
		//someones searching for specific users
		
		let lnkArr;
		let loggedin;
		if (!req.session.loggedin)
		{
			lnkArr = Array.from(header1Arr);
			loggedin = false;
		}
		else
		{
			lnkArr = Array.from(header2Arr);
			lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
			lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
			loggedin = true;
		}
	
		let userArr = [];
		//utilizing regex to find all matches, option i designates case insensitivity
		db.collection("users").find({privacy: false, username: {$regex: req.query.name, $options: 'i'}}, function(err, result)
		{
			result.toArray(function(err, arr)
			{
				//now have an array of all the users that match the request
				let userArr = [];
				arr.forEach(user =>
				{
					let newU = {};
					newU.lnk = "/users/" + user._id;
					newU.title = user.username;
					userArr.push(newU);
				});

				res.render("./pages/users", {lnkArr, userArr, loggedin});
			});
			
		});
	}

}

//renders the page of a specific user, if the a userId parameter has been given
function paramParser(req, res, next)
{
	
	if (!req.params.userId)
	{
		next();
	}
	else
	{
		let tempId;
		try
		{
			tempId = new ObjectId(req.params.userId);
		}
		catch(err)
		{
			res.status(404).send("User ID " + req.params.userId + " does not exist.");
			return;
		}
		db.collection("users").findOne({_id: tempId}, function(err, result)
		{
			if (!result)
			{
				res.status(404).send("Error. User does not exist.");
				return;
			}

			let username = result.username;
			let ownprofile;
			if (req.session.loggedin && req.session.uid == req.params.userId)
			{
				//user must be the owner of the acct they are trying to view
				ownprofile = true;
				let lnkArr = Array.from(header2Arr);
				lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
				lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
				let loggedin = true;
				let orderArr = [];


				db.collection("orders").find({username: username}, function(err, orders)
				{
					
					if (!orders)
					{
						res.render("./pages/userPage", {lnkArr, loggedin, username, orderArr, ownprofile});
					}
					
					orders.toArray(function(err, orderArray )
					{
						orderArray.forEach(order =>
						{
							let newO = {};
							newO.lnk = "/orders/" +order._id;
							newO.id = order._id;
							orderArr.push(newO);

						});			
					
						res.render("./pages/userPage", {lnkArr, loggedin, username, orderArr, ownprofile});

					});
				});

			}
			else if (result.privacy)
			{
				//its private, and either your logged in and its not yours, or your not logged in at all -> should not be able to view the page
				res.status(403).send("Error. This profile is set to private. If this is your profile, please login first and try again.");
			}
			else 
			{
				//its public
				ownprofile = false;
				let loggedin;
				let lnkArr;
				let orderArr = [];
				if (req.session.loggedin)
				{
					
					lnkArr = Array.from(header2Arr);
					lnkArr.push({title: "Profile page", lnk: "/users/" +req.session.uid, id: "ppID"});
					lnkArr.push({title: "Logout", lnk: "/logout", id: "lgID"})
					loggedin = true;
				}
				else
				{
					lnkArr = Array.from(header1Arr);
					loggedin = false;
				}

				db.collection("orders").find({username: username}, function(err, orders)
				{
					if (!orders)
					{
						res.render("./pages/userPage", {lnkArr, loggedin, username, orderArr, ownprofile});
					}
					
					orders.toArray(function(err, orderArray )
					{
						orderArray.forEach(order =>
						{
							let newO = {};
							newO.lnk = "/orders/" +order._id;
							newO.id = order._id;
							orderArr.push(newO);

						});			
					
						res.render("./pages/userPage", {lnkArr, loggedin, username, orderArr, ownprofile});

					});
				});
			}
		});
	}

}

//handles saving new privacy data related to a specific user
function savePrivacy(req, res, next)
{
	if (!req.body || !req.session.uid)
		return;

	if (req.body.privacy == "public")
	{
		db.collection("users").updateOne({_id: ObjectId(req.session.uid)}, {$set: {privacy: false}});
	}
	else
	{
		db.collection("users").updateOne({_id: ObjectId(req.session.uid)}, {$set: {privacy: true}});
	}
	res.status(200).redirect("/");



}

//handles logging into the website
function login(req, res, next)
{
	if(req.session.loggedin){
		res.status(200).send("Error; Already logged in.");
		return;
	}
	
	let username = req.body.username;
	let password = req.body.password;
	db.collection("users").findOne({username: username}, function(err, result){
		if (err) throw err;
		
		if(result){
			if(result.password === password){
				req.session.loggedin = true;
				req.session.username = username;
				
				req.session.uid = result._id;
				
				res.status(200).redirect("/");
				
			}
			else
			{
				res.status(401).send("Not authorized. Invalid password.");
			}
		}
		else
		{
			res.status(401).send("Not authorized. Invalid username.");
			return;
		}
	});
}



function serveR(req, res, next)
{	
	res.status(200).json(restaurants);
}

//routing
app.use(express.static("./"));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.get("/restaurants", serveR);
app.get("/", deliverHome);
app.get("/users", queryParser, serveUsers)
app.get("/users/:userId", paramParser);
app.post("/users", savePrivacy);
app.get("/orders", serveOrder)
app.post("/orders", saveNewOrder);
app.get("/orders/:orderId", getOrder);
app.post("/login", login);
app.get("/logout", function(req, res)
{
	req.session.loggedin = false;
	delete req.session.username;
	delete req.session.uid;
	
	let lnkArr = Array.from(header1Arr);
	res.render("./pages/logout", {lnkArr});
});	

app.post("/newuser", registerNewUser);

app.get("/newuser", function(req, res)
{
	let lnkArr = Array.from(header1Arr);
	let alert = false;
	res.render("./pages/registerUser", {lnkArr, alert} );

});


//load restaurant info from local restaurants directory
fs.readdir("./restaurants", function(err, files)
{
	let counter = 0;
	if(err)
	{
		console.log(err);
		send500(response);
		return;
	}
	files.forEach(fname => {
		fs.readFile("./restaurants/" +fname, function(err, data)
		{
			if(err)
			{
				console.log(err);
				send500(response);
				return;
			}
			restaurants.push(JSON.parse(data));
			if (counter != (files.length - 1))
				counter++;
			else
				launch();    //only launch the server once the files have finished being read, and all relevant info has been stored in the restaurants array
		});
	});
});

function launch()
{
	mc.connect("mongodb://localhost:27017", function(err, client) {
		if (err) {
			console.log("Error in connecting to database");
			console.log(err);
			return;
		}
		
		//Get the database and save it to a variable
		db = client.db("serverData");
		
		//Only start listening now, when we know the database is available
		app.listen(3000);
		//console.log("Server listening on port 3000");
	});
}