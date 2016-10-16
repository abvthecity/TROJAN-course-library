// How to use TROJAN.terms()

var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

TROJAN.terms().then(console.log);
// expected output: [20162, 20163, 20171]

TROJAN.current_term().then(console.log);
// expected output: 20171
