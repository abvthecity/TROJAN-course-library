/*
USC SOC SPEED TEST
Here, we are conducting a test on USC's SOC server by pinging it
dozens of times until we collect all course data from its server.

We'll console.log 3 items:

1. a map of description -> courseArray. Gives us insight about non-nested data.
2. an array of all courses offered at USC
3. length of that array. current test shows 4136 courses!
*/

var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

var oldTime = Date.now();
var term = 20173;

// get full list of departments with courses
TROJAN.deptsCN(term).then(function (dlist) {
  var arrayOfDepts = Object.keys(dlist);

  // we want to iterate through each dept and grab its data,
  // and return the final results once we process the last dept.
  var maxIndex = arrayOfDepts.length;
  var index = 0;

  // this is where the data will be stored.
  var masterSectionToDesc = {};
  var masterCoursesArray = [];

  // now, go through all departments
  TROJAN.deptBatch_cb(arrayOfDepts, term, function (deptData) {
    var courses = deptData.courses;
    var coursesArray = _.values(_.mapValues(courses, function (course) {
      return course.courseId;
    }));

    // create object pairing between section id and its description
    var sectionToDesc = _.mapValues(courses, function (course) {
      var sections = Object.keys(course.sections);
      var transformed = _.map(sections, function (section) {
        return course.sections[section].description;
      });

      return _.filter(transformed, function (item) {
        return item != null;
      }).toString();
    });

    // merge it with the master data collector
    masterSectionToDesc = _.merge(masterSectionToDesc, sectionToDesc);
    masterCoursesArray = masterCoursesArray.concat(coursesArray);
    console.log(masterCoursesArray.length);
    index += 1;

    // once we hit the last index, turn the desc into the key.
    if (maxIndex <= index) {
      console.log(_.invertBy(masterSectionToDesc));

      // let's turn coursedata into a set:
      masterCoursesArray = _.uniq(masterCoursesArray);
      console.log(masterCoursesArray);
      console.log("COURSE COUNT:", masterCoursesArray.length);
    }
  });
});
