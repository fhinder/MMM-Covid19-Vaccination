/* Magic Mirror
 * Node Helper: MMM-Covid19-Vaccination
 * 
 * By Fabian Hinder
*/

var NodeHelper = require("node_helper")
var request = require("request");

const BASE_URL_Morgenpost = "https://interaktiv.morgenpost.de/data/corona/rki-vaccinations.json";
const BASE_URL_BMG = "https://impfdashboard.de/static/data/germany_vaccinations_by_state.tsv";

module.exports = NodeHelper.create({
	// Override start.
	start: function () { },
	
	/** Override socekt notification handler
	 * @param {string} notification
	 * @param {object} payload, containing configuration
	*/
	socketNotificationReceived: function(notification, payload) {
		switch(notification) {
			case "GET_VACC_DATA":
				let self = this;
				self.getVaccData(payload);
				break;
		}
	},

	/** Define getVaccData function
	 * Returns data from API call
	 * @param {object} configuration, containing counties
	*/
	getVaccData: function(payload) {
		if (payload.config.dataSource == "BMG") this.getVaccBMG(payload);
		if (payload.config.dataSource == "Morgenpost") this.getVaccDataMorgenpost(payload);
	},

	getVaccBMG: function (payload) {
		let self = this;
		let url = BASE_URL_BMG;

		let options = {
			'method': 'GET',
			'url': encodeURI(url),
			'headers': {
			}
		};

		request(options, function (error, response) {
			if (error) {
				throw new Error(error);
				self.sendSocketNotification("VACC_DATA_ERROR", error);
			} else {
				let tsv = response.body;
				let lines = tsv.split("\n");
				let data = [];
				let headers = lines[0].split("\t");

				//first line: header>start at 1, last line: empty -> end at length-1
				for (let i = 1; i < lines.length-1; i++) {
					let obj = {};
					let currentline = lines[i].split("\t");
					for (let j = 0; j < headers.length; j++) {
						obj[headers[j]] = currentline[j];
					}
					data.push(obj);
				}

				let dataRet = []
				for (let i = 0; i < payload.config.states.length; i++) {
					//Obje to comulate numbers for Germany
					let objDE = {
						'code': "DE",
						'name': "Deutschland",
						'peopleFirstTotal': 0,
						'peopleFullTotal': 0,
						'vaccinationsTotal': 0
					}
					for (let j = 0; j < data.length; j++) {
						let stateToFind = payload.stateMapping[payload.config.states[i]];
						let currentState = data[j].code;//['code'];
						if (stateToFind == currentState) {
							data[j]['name'] = payload.config.states[i];
							dataRet.push(data[j]);
						}
						//Calc Germany
						if (stateToFind == "DE") {
							objDE['peopleFirstTotal'] += parseInt(data[j].peopleFirstTotal);
							objDE['peopleFullTotal'] += parseInt(data[j].peopleFullTotal);
							objDE['vaccinationsTotal'] += parseInt(data[j].vaccinationsTotal);
							if (j == data.length - 1) {
								dataRet.push(objDE);
							}
						}
					}
				}
				if (payload.config.states.length == 0) dataRet = data;
				self.sendSocketNotification("VACC_DATA", dataRet);
			}
		});
	},

	getVaccDataMorgenpost: function (payload) {
		let self = this;
		let url = BASE_URL_Morgenpost;

		let options = {
			'method': 'GET',
			'url': encodeURI(url),
			'headers': {
			}
		};

		request(options, function (error, response) {
			if (error) {
				throw new Error(error);
				self.sendSocketNotification("VACC_DATA_ERROR", error);
			} else {
				let data = JSON.parse(response.body);
				for (let j = 0; j < data.length; j++) {
					data[j]['peopleFirstTotal'] = data[j].cumsum_latest - data[j].cumsum2_latest;
					data[j]['peopleFullTotal'] = data[j].cumsum2_latest;
					data[j]['vaccinationsTotal'] = data[j].cumsum_latest;
				}
				let dataRet = []
				for (let i = 0; i < payload.config.states.length; i++) {
					for (let j = 0; j < data.length; j++) {
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
