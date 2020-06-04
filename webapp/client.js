//Max Dobrei
function init()
{		
	let newIntro = document.getElementById("intromsg");
	let welcome = "Here at InsertRichCompany's Restaurant Managing Page^tm, we give the best customer support to our users."
	+"If your a new user, please click on the link to register and be able to order food!"
	+"If your an existing user, please use the login form below.";
	newIntro.innerText = welcome;
}

function initWelcome()
{
		
	let newIntro = document.getElementById("intromsg");
	let welcome = "Welcome to the website. Please enjoy your stay! Use the links above to navigate the webpage.";
	newIntro.innerText = welcome;
}

function newUserName()
{
	alert("The username you tried before has already been taken. Please enter another username and try again.");
}

function exit()
{
	let xml = new XMLHttpRequest();
	
	xml.open("POST", "/logout", true );
	xml.send();
}