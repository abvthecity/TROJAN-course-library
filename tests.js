var TROJAN = require('./TROJAN');
var _ = require('lodash');

var oldTime = Date.now();

TROJAN.deptsN(20163).then(function (dlist) {
  TROJAN.deptBatch(Object.keys(dlist), 20163).then(function (data) {
    console.log(data);
    console.log('TIME ELAPSED: ', Date.now() - oldTime);
  }, console.error);
}, console.error);
