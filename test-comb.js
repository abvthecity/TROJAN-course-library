var _ = require('lodash');
var TROJAN = require('./TROJAN');
var combinations = require('./src/combinations');

// TROJAN.deptsN(20163).then(function (depts) {
//   TROJAN.deptBatch_cb(Object.keys(depts), 20163, function (dept) {
//     TROJAN.courses(dept).then(function (courses) {
//       // console.log(dept.meta.abbreviation);
//       _.forEach(courses, function (course) {
//         var truth = combinations.type(course.sections);
//         if (truth) console.log(course.courseId, combinations.typeOrder(course.sections));
//       });
//     });
//   });
// });

var a = 'ISE';
var b = 560;
TROJAN.course(a, b, null, 20163).then(function (course) {
  combinations.generate(course[a + '-' + b].sections).then(console.log);
});
