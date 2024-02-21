//Max Dobrei
//initializes a simple database of users to facilitate testing the restaurant ordering webpage
//each user has three properties; a username, a password, and a privacy setting.


let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

//the passwords are initialized to be identical to the fake usernames, obviously this would be bad practice in any legitamate business application. 
//the privacy setting is initialized to false to begin with, meaning any new users or 'guest' users may publically see these profiles.
//no ordering history is tied to them yet, easier to test manually then automate it

//tried to have a little fun with it
let userNames = ["winstoniscool", "laura", "cooperzz67", "hoenheim1001", "elric02", "p123456", "mickjenkinsofficial", "snoopdogg", "charizard",  "password"];
let users = [];

userNames.forEach(name =>{
	let u = {};
	u.username = name;
	u.password = name;
	u.privacy = false;
	users.push(u);
});


//connect to the local instance running on the computer
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;	

  //either get or create the database called serverData
  db = client.db('serverData');
  
  db.listCollections().toArray(function(err, result){
	if(err) throw err;
	 
	//if this is a new database entirely, add the new users and stop.
	if(result.length == 0){
		db.collection("users").insertMany(users, function(err, product){
			if(err) throw err;
			
			console.log(result.insertedCount + " users successfully added (should be 10!)");
			client.close();
		});
		return;
	 }
	 

	 //otherwise, database already exists, we will overwrite any of the old user data and start afresh. 
	 let numDropped = 0;
	 let toDrop = result.length;
	 result.forEach(collection => {
		db.collection(collection.name).drop(function(err, delOK){
			if(err){
				throw err;
			}
			
			console.log("Dropped collection: " + collection.name);
			numDropped++;
			
			if(numDropped == toDrop){
				db.collection("users").insertMany(users, function(err, result){
					if(err){
						throw err;
					}
					
					console.log(result.insertedCount + " users successfully added (should be 10).");
					client.close();
				});
			}
		});		
	 });
  });
});
