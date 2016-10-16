// How to use TROJAN.combinations()

var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

// there's hidden magic in this combinations algorithm.
// it's not fool-proof but it does the work most of the times I've tried it.
// only a handful of classes require an order, and I've accounted for it.

TROJAN.course('ACAD', 376, null, 20163).then(function (courseData) {
  // console.log(courseData);
  let course = courseData[Object.keys(courseData)[0]];

  console.log(TROJAN.combinations_async(course));
});
