var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

TROJAN.course('CSCI', 201).then(function (coursedata) {

  // console.log(coursedata['SWMS-301']);

  TROJAN.combinations(coursedata['CSCI-201']).then(console.log)

});
