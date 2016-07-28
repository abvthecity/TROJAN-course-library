var TROJAN = require('./TROJAN');
var combinations = require('./src/combinations');
var _ = require('lodash');

var oldTime = Date.now();

// TROJAN.deptsY(20163).then(function (dlist) {
//   TROJAN.deptBatch(Object.keys(dlist), 20163).then(function (data) {
//     console.log(Object.keys(data));
//     console.log('TIME ELAPSED: ', Date.now() - oldTime);
//   }, console.error);
// }, console.error);

TROJAN.deptsN(20163).then(function (dlist) {
  var max = Object.keys(dlist).length;
  var count = 0;
  var obj = {};

  TROJAN.deptBatch_cb(Object.keys(dlist), 20163, function (data) {
    TROJAN.courses(data).then(function (courses) {
      var all = _.mapValues(courses, function (course) {
        var transformed = _.map(combinations.sectionOrder(course.sections), function (section) {
          return course.sections[section].description;
        });

        return _.filter(transformed, function (item) {
          return item != null;
        }).toString();
      });

      console.log(Object.keys(obj).length);

      obj = _.merge(obj, all);
      count++;

      if (max == count) {
        // arr.sort(function (a, b) {
        //   if (a.length > b.length) return 1;
        //   if (a.length < b.length) return -1;
        //   return 0;
        // });

        console.log(_.invertBy(obj));
      }

    });
  });
});
