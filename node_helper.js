/* Magic Mirror
 * Node Helper: MMM-Covid19-Vaccination
 * 
 * By Fabian Hinder
*/

var NodeHelper = require("node_helper")
var request = require("request");

const BASE_URL = "https://interaktiv.morgenpost.de/data/corona/rki-vaccinations.json";


module.exports = NodeHelper.create({
	// Override start.
	start: function() {},
	
	/** Override socekt notification handler
	 * @param {string} notification
	 * @param {object} payload, containing configuration
	*/
	socketNotificationReceived: function(notification, payload) {
		switch(notification) {
			case "GET_VACC_DATA":
				var self = this;
				self.getVaccData(payload);
				break;
		}
	},

	/** Define getVaccData function
	 * Returns data from API call
	 * @param {object} configuration, containing counties
	*/
	getVaccData: function(payload) {
		var self = this;
		var url = BASE_URL;

		var options = {
			'method': 'GET',
			'url': encodeURI(url),
			'headers': {
			}
		};	
		
		request(options, function (error, response) {
			if (error){
				throw new Error(error);
				self.sendSocketNotification("VACC_DATA_ERROR", error);
			} else {
				let data = JSON.parse(response.body);
				let dataRet = []
				for (let i = 0; i < payload.config.states.length;i++) {
					for (let j = 0; j < data.length; j++){
						if (payload.config.states[i] == data[j].name) {
							dataRet.push(data[j]);
						}
					}
				}
				if (payload.config.states.length == 0) dataRet = data;
				self.sendSocketNotification("VACC_DATA", dataRet);
			}
		}); 
	}
});
