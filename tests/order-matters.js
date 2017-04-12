var TROJAN = require('../src/TROJAN');

var courseId = TROJAN.parseCourseId('BUAD-307');

TROJAN.course(courseId)
	.then(function (courses_object) {
		var course_id = Object.keys(courses_object.courses)[0];
		var course_object = courses_object.courses[course_id];
		return TROJAN.combinations(course_object);
	})
	.then(console.log);
