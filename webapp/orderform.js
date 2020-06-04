//MAX DOBREI 
let currOrder = false;

let restaurants = [];

let subtotal = 0.0;
let tax = 0.0;
let total = 0.0;

let finalOrder = {};

function init(){
	
	//dynamically load the possible restaurants to choose from in the pages drop
	//down menu, as well as relevant menu info etc, by requesting the info from the server

	let xml = new XMLHttpRequest();
	xml.onreadystatechange = function()
	{
		if (this.status == 200 && this.readyState == 4)
		{
			restaurants = JSON.parse(this.responseText);


			console.log(restaurants);

			finalOrder = {restaurantID: -1, restaurantName: "", subtotal: 0.0, total: 0.0, fee: 0.0, tax: 0.0, order: {}  }


			//initialize the drop down menu
			initMenu();
		}
	}
	xml.open("GET", "/restaurants", true );
	xml.send();	
}

function initMenu()
{
	let select = document.getElementById("restMenu").firstElementChild;
	
	let prompt = document.createElement("option");
	prompt.selected = true;
	let pContent = document.createTextNode("Please select a restaurant...");
	
	prompt.appendChild(pContent);
	select.appendChild(prompt);
	
	for (let i = 0; i < restaurants.length; i++)
	{
		let newOption = document.createElement("option");
		let newRestaurant = document.createTextNode(restaurants[i].name)
	
		newOption.appendChild(newRestaurant);
		select.appendChild(newOption);

	}
	select.addEventListener("change", switchRestaurant);

}

function submitOrder()
{
	if (subtotal === 0.0 || tax === 0.0 || total == 0.0)
	{
		alert("This is an invalid order. Please try again after meeting the minimum order price");
		return;
	}

	console.log(finalOrder);

	finalOrder.total = finalOrder.subtotal + finalOrder.fee + (finalOrder.subtotal * 0.10);
	finalOrder.tax = finalOrder.subtotal * 0.10;

	let xml = new XMLHttpRequest();
	xml.onreadystatechange = function()
	{
		if (this.status == 200 && this.readyState == 4)
		{
			alert("Order placed!")
			finalOrder = {restaurantID: -1, restaurantName: "", subtotal: 0.0, total: 0.0, fee: 0.0, tax: 0.0, order: {}  }
		}
	}
	xml.open("POST", "http://localhost:3000/orders", true );
	xml.setRequestHeader("Content-Type", "application/json");
	xml.send(JSON.stringify(finalOrder));	

}


function switchRestaurant()
{
	
	let index = document.getElementById("restMenu").firstElementChild.selectedIndex - 1;
	//if "please select a restaurant" is selected, dont wanna do anything.
	if (index === -1)
		return;

	//they have not submitted their current order, ie one is still in progress
	if (currOrder)
	{
		if (confirm("You have not finished submitting your order! If you would like to visit"
		+ " a new restaurant page, your current order will be wiped. Continue?"))
		{
			document.getElementById("colThree").innerHTML = "";
		
			//reset order coloumn
			subtotal = 0;
			total = 0;
			tax = 0;
			
			finalOrder = {restaurantID: -1, restaurantName: "", subtotal: 0.0, total: 0.0, fee: 0.0, tax: 0.0, order: {}  }

			//set currOrder to false
			currOrder = false;

			//recall fnxn or simulate another page switch
			document.getElementById("restMenu").firstElementChild.selectedIndex = -1;
			document.getElementById("restMenu").firstElementChild.selectedIndex = index + 1;
			switchRestaurant();		
		}
	}
	//no order in progress, can simply switch info. no need for an alert
	else
	{
		
		finalOrder.restaurantID = index;
		finalOrder.restaurantName = restaurants[index].name;
		finalOrder.fee = restaurants[index].delivery_fee;



		//reset menu info
		document.getElementById("colTwo").innerText = "";
		document.getElementById("colOne").innerText = "";
		document.getElementById("colThree").innerText = "";

		let newButton = document.createElement("button");
		newButton.innerText = "Submit Order";
		newButton.setAttribute("id", "orderB");
		newButton.setAttribute("onclick", "submitOrder()");

		let orderHead = document.createElement("h3");
		orderHead.innerText ="Current Order Summary";
		orderHead.setAttribute("id", "HEADER");
		document.getElementById("colThree").appendChild(orderHead);
		
		let subtotalP = document.createElement("p");
		subtotalP.setAttribute("id", "subtotal");
		subtotalP.innerText = "\n-----------\nSubtotal:  $"+subtotal +"\n-----------\nTax: $" +tax +"\n-----------\nTotal: $" +total;
		document.getElementById("colThree").appendChild(subtotalP);

		document.getElementById("colThree").appendChild(newButton);

		let restaurant = restaurants[index];
		
		//create new title
		let newTitle = document.getElementById("letitle");
		newTitle.innerText = "Hello! Welcome to " + restaurant.name + "!";
	
		//create new intro msg
		let newIntro = document.getElementById("intromsg");
		let welcome = "Here at " +restaurant.name +" we offer some of the best "
		+" food the whole Middle Earth has to offer!  Our delivery fee is $" +restaurant.delivery_fee
		+". A minimum subtotal of $" +restaurant.min_order +" is required to place an order." 
		+"\n\n Thank you for your business and enjoy your food!";
		newIntro.innerText = welcome;

		//load menu info
		let categories = Object.keys(restaurant.menu);
		
		for (let i = 0; i < categories.length; i++)
		{
			let coolCat = categories[i];
		
			//get all items associated with each category
			
			let catItems = Object.values(restaurant.menu[coolCat]);
			//console.log(catItems);


			//input info into menu coloumn
			let menuCol = document.getElementById("colTwo");

			//initialize a header for the category
			let catHeader = document.createElement("h3");
			let inHeader = document.createTextNode(coolCat);
			
			catHeader.setAttribute("id", coolCat)
			catHeader.appendChild(inHeader);
			menuCol.appendChild(catHeader);

			for (let j = 0; j < catItems.length; j++)
			{
				let dish = catItems[j];
				
				//new menu item
				let dishNode = document.createElement("p");
				
				let dishInfo = document.createTextNode("\n" +dish.name + ": " +dish.description +"; $" +dish.price);

				dishNode.appendChild(dishInfo);
				menuCol.appendChild(dishNode);
		
				let addImg = document.createElement("img");
				addImg.setAttribute("src", "add.jpg");
				addImg.setAttribute("width", "15");
				addImg.setAttribute("height", "15");
				
				addImg.addEventListener("click", function(){
					
					
					
					currOrder = true;

					//if this is the first one of the dish being added
					if (document.getElementById(dish.name) === null)
					{
						let newEntry = document.createElement("p");
						let dishFo = document.createTextNode(dish.name +" x 1 = " +dish.price);
						newEntry.setAttribute("id", dish.name);
						newEntry.setAttribute("quantity", "1");
						newEntry.appendChild(dishFo);
						
						finalOrder.subtotal += dish.price;
						finalOrder.order[dish.name]  = {quantity: 1};

				
						let removeImg = document.createElement("img");
						removeImg.setAttribute("src", "remove.jpg");
						removeImg.setAttribute("width", "15");
						removeImg.setAttribute("height", "15");
						removeImg.addEventListener("click", function(){
							if (newEntry.getAttribute("quantity") == 1)
							{
								
								finalOrder.subtotal -= dish.price;
								delete finalOrder.order[dish.name];
								
								
								document.getElementById(dish.name).remove();
								subtotal -= dish.price;
								if (subtotal == 0 )
								{
									currOrder = false;
									
									tax = 0;
								
									total = 0;

									finalOrder = {restaurantID: -1, restaurantName: "", subtotal: 0.0, total: 0.0, fee: 0.0, tax: 0.0, order: {}  };

								}
									
								tax = 0.10 * subtotal;
								total = subtotal + tax;
								
								document.getElementById("subtotal").innerText = subtotalP.innerText = "\n-----------\nSubtotal:  $"+subtotal +"\n-----------\nTax: $" +tax +"\n-----------\nTotal: $" +total;
							}
							else
							{
									
								let quant = parseInt(newEntry.getAttribute("quantity"));
								quant -= 1;
								document.getElementById(dish.name).setAttribute("quantity", quant);
								newEntry.replaceChild(document.createTextNode(dish.name + " x " +quant +" = " +quant*dish.price), newEntry.firstChild );
								
								finalOrder.subtotal -= dish.price;
								finalOrder.order[dish.name] = {quantity: quant};

								subtotal -= dish.price;
								tax = 0;
								tax = 0.10 * subtotal;
								total = 0;
								total = subtotal + tax;
								if (total == 0 )
									currOrder = false;

								document.getElementById("subtotal").innerText = "\n-----------\nSubtotal:  $"+subtotal +"\n-----------\nTax: $" +tax +"\n-----------\nTotal: $" +total;
								
							}

						});
							
						newEntry.appendChild(removeImg);
						document.getElementById("HEADER").insertAdjacentElement("afterend", newEntry);

						subtotal += dish.price;
						tax = 0;
						tax = 0.10 * subtotal;
						total = 0;
						total = subtotal + tax;
					
						console.log("sub:" +subtotal);
						console.log("tax:" +tax);
						console.log("ttal:" +total);

						document.getElementById("subtotal").innerText = "\n-----------\nSubtotal:  $"+subtotal +"\n-----------\nTax: $" +tax +"\n-----------\nTotal: $" +total;
					}
					else
					{
						
						let newEntry = document.getElementById(dish.name);
						let quant = parseInt(newEntry.getAttribute("quantity"));
						quant+= 1;
						
						finalOrder.subtotal += dish.price;
						finalOrder.order[dish.name]  = {quantity: quant};

						
						newEntry.replaceChild(document.createTextNode(dish.name + " x " +quant +" = " +quant*dish.price), newEntry.firstChild );
									
						newEntry.setAttribute("quantity", quant.toString());
						
						subtotal += dish.price;
						tax = 0;
						tax = 0.10 * subtotal;
						total = 0;
						total = subtotal + tax;
					
						console.log("sub:" +subtotal);
						console.log("tax:" +tax);
						console.log("ttal:" +total);

						document.getElementById("subtotal").innerText =  "\n-----------\nSubtotal:  $"+subtotal +"\n-----------\nTax: $" +tax +"\n-----------\nTotal: $" +total;
					}

				});
			
				menuCol.appendChild(addImg);
			}
		}
		//adjust heights of the other two coloumns to match
		let catCol = document.getElementById("colOne");
		
		let orderCol = document.getElementById("colThree");
		
		//load categories into coloumn
		let newHead = document.createElement("h3");
		let hdContent = document.createTextNode("Categories");
		newHead.appendChild(hdContent);
		catCol.appendChild(newHead);

		for (let i = 0; i < categories.length; i++)
		{
			let coolCat = categories[i];
			let newLnk = document.createElement("p");
			newLnk.innerText = coolCat;
			newLnk.addEventListener("click", function() {
				document.getElementById(coolCat).scrollIntoView();
			});
			
			catCol.appendChild(newLnk);
		}
		 
		 //attempting to shift the left n right coloumns upwards to match top edge of menu coloumn
		catCol.style.bottom = (document.getElementById("colTwo").scrollHeight - catCol.scrollHeight).toString() +"px";
	
		orderCol.style.bottom = (document.getElementById("colTwo").scrollHeight - orderCol.scrollHeight).toString() +"px";
		
	}
}
