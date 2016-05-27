(function() {
	var app = angular.module('dateService', []);
	
	app.factory('dateConverter', [function() {
		var convertDigit = function(digit) {
			if (digit < 10) {
				return '0' + digit;
			} else {
				return digit;
			}
		};
		return function(id) {
			var date = new Date(parseInt(id.substring(0, 8), 16) * 1000);
			var isToday = date.toDateString() == (new Date()).toDateString();
			return convertDigit(date.getHours()) + ':' + convertDigit(date.getMinutes()) + ':' + convertDigit(date.getSeconds()) + 
					(isToday ? '' : ' ' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
		};
	}]);
	
})();
