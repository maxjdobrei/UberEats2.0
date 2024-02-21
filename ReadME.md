
A basic webpage that allows users to 'signup' with a password, visit other peoples profiles pages, and 'order food' from a dedicated ordering page. Allows for ordering from multiple restaurants and their respective menus. See ReadMe for more details.

 
Files that should be included:

	-templates(folder) contains the several ejs files which will be used with the template engine to render
	html pages back to the user. 

	-add.jpg and remove.jpg, both needed for the ordering page

	-client.js, which will be sent to the browser and will interact with the server to dynamically alter webpages visited

	-server.js which will act as an HTTP server and handle all interactions with the browser and client.js

	-database-initializer.js which creates some data to facilitate testing the webpage.

	-orderform.js and orderform.ejs, separate js and template files for handling the ordering page

	-package.json a file to facilitate the installation of all dependencies required to run server.js
	

if you have npm installed, simply enter npm install when you are accessing the local directory from a terminal.	
		
To begin, you must be running the mongodb daemon in some form, associated with the empty db folder in this local directory 
or a folder of your choice, and connected to the default (localhost) url and default port.
Once thats done, you can enter the local directory in a terminal, and enter

node database-initializer.js 

to populate the db with some user data to interact with.
Alternatively you can skip that and just enter 

node server.js

to run the server. To actually peruse the webpage itself, open the url 'localhost:3000' in any modern browser. 
