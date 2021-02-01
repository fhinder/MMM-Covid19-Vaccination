/* Magic Mirror
 * Module: MMM-Covid19-Vaccination
 *
 * By Fabian Hinder
 * Data based on Berliner Morgenpost:
 * https://interaktiv.morgenpost.de/data/corona/rki-vaccinations.json
*/

Module.register("MMM-Covid19-Vaccination", {
	// Default module config
	defaults: {
		reloadInterval: 60*60*1000, //once per hour
		tableClass: "small",
		percentage: true,
		states: [
			"Deutschland",
			"Berlin",
			"Baden-Würtemberg",
			"Nordrhein-Westfalen"
		]
	},
	
	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);
		this.dataVacc = [];
		this.loaded = false;
		this.dataPopulation = {
			"Baden-Württemberg": 11100394,
			"Bayern": 13124737,
			"Berlin": 3669491,
			"Brandenburg": 2521893,
			"Bremen": 681202,
			"Hamburg": 1847253,
			"Hessen": 6288080,
			"Mecklenburg-Vorpommern": 1608138,
			"Niedersachsen": 7993608,
			"Nordrhein-Westfalen": 17947221,
			"Rheinland-Pfalz": 4093903,
			"Saarland":	986887,
			"Sachsen": 4071971,
			"Sachsen-Anhalt": 2194782,
			"Schleswig-Holstein": 2903773,
			"Thüringen": 2133378,
			"Deutschland": 83166711
		}
	},
	
	// Override dom generator.
	getDom: function (){
		const wrapper = document.createElement("div");
		
		if(!this.loaded){
			wrapper.innerHTML = "Lade ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		if(this.dataVacc.length==0){
			wrapper.innerHTML = "Ups something went wrong";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
	
		
		var table = document.createElement("table");
		table.className = this.config.tableClass;

		var data = ['Land', 'Erste Impfung', 'Impfungen letzte 7 Tage', 'Zweite Impfung'];
			
		var thead = table.createTHead();
		var row = thead.insertRow();
		for (var key of data) {
			var th = document.createElement("th");
			var txt = document.createTextNode(key);
			th.appendChild(txt);
			row.appendChild(th);
		}
		
		for (let i =0; i<this.dataVacc.length; i++){
			var d = this.dataVacc[i];
			var row = document.createElement("tr");
			var value = 0;
			table.appendChild(row);
			
			var stateCell = document.createElement("td");
			stateCell.className = "state";
			stateCell.innerHTML = d.name;
			row.appendChild(stateCell);
			
			var sumLatest = document.createElement("td");
			sumLatest.className = "sumLatest";
			this.config.percentage ? value = Math.round(d.cumsum_latest / this.dataPopulation[d.name] * 10000) / 100 +"%" : value = d.cumsum_latest;
			sumLatest.innerHTML = value;
			row.appendChild(sumLatest);

			var sum_7days = document.createElement("td");
			sum_7days.className = "sum_7days";
			this.config.percentage ? value = Math.round(d.cumsum_7_days_ago / this.dataPopulation[d.name] * 10000) / 100 + "%" : value = d.cumsum_7_days_ago;
			sum_7days.innerHTML = value;
			row.appendChild(sum_7days);

			var sum2Latest = document.createElement("td");
			sum2Latest.className = "sumLatest";
			this.config.percentage ? value = Math.round(d.cumsum2_latest / this.dataPopulation[d.name] * 10000) / 100  +"%": value = d.cumsum2_latest;
			sum2Latest.innerHTML = value;
			row.appendChild(sum2Latest);
			
			if(i==0) this.dataVacc.lastUpdate = d.date;
		}
		return table;
	},
	
	// Override getHeader method.
	getHeader: function () {
		if(this.dataVacc.lastUpdate) return "Impfdaten von " + this.dataVacc.lastUpdate;
		return this.data.header ? this.data.header : "Impfdaten";
	},
	
	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		switch(notification) {
			case "DOM_OBJECTS_CREATED":
				//Update the data, after creating
				this.sendSocketNotification("GET_VACC_DATA", 
					{
						"config": this.config,
						"identifier": this.identifier
					}
				)
				//Start timer for update
				var timer = setInterval( ()=> {
					this.sendSocketNotification("GET_VACC_DATA", 
						{
							"config": this.config,
							"identifier": this.identifier
						}
					)
				}, this.config.reloadInterval);
				break;
		}
	},
	
	// Override socket notification handler
	socketNotificationReceived: function(notification, payload) {
		switch(notification) {
			case "VACC_DATA":
				console.log(payload);
				this.dataVacc = payload;
				this.dataVacc.lastUpdate = "";
				this.loaded = true;
				this.updateDom();
				break;
			case "VACC_DATA_ERROR":
				this.dataVacc = [];
				//ToDo Error Handling to user
				break;
		}
	}
}
)

