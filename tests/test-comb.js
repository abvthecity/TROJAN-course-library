var _ = require('lodash');
var TROJAN = require('./TROJAN');
var combinations = require('./src/combinations');

// var a = 'MKT';
// var b = 499;
// var c = '';
// TROJAN.course(a, b, c, 20163).then(function (course) {
//   course = course[a + '-' + b + c];
//   var obj = combinations.generate(course.sections);
//   console.log(obj);
//
//   // TROJAN.combinations(course).then(console.log, console.error);
// });

TROJAN.session('112', 20163).then(console.log, console.error);
