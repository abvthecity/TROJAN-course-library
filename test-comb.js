var _ = require('lodash');
var TROJAN = require('./TROJAN');
var combinations = require('./src/combinations');

var a = 'CTAN';
var b = 452;
var c = '';
TROJAN.course(a, b, c, 20163).then(function (course) {
  course = course[a + '-' + b + c];
  TROJAN.combinations(course).then(console.log);
});
