var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

TROJAN.course('SWMS', 301).then(function (coursedata) {

  // console.log(coursedata['SWMS-301']);

  TROJAN.combinations(coursedata['SWMS-301']).then(console.log)

});
