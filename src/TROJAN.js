'use strict';
var _ = require('lodash');
var Promise = require('bluebird');
var urlparse = require('./urlparse');
var normalize = require('./normalize');
var combinations = require('./combinations');

var deptRegExp = new RegExp('^[a-z]+(?!\D\W)', 'i');
var numRegExp = new RegExp('[0-9]+', 'i');
var seqRegExp = new RegExp('[a-z]$', 'i');

function getDept(courseId) {
	if (!courseId) return null;
	var dept = deptRegExp.exec(courseId);
	if (dept) dept = dept[0].toUpperCase();
	return dept;
}

function getNum(courseId) {
	if (!courseId) return null;
	var num = numRegExp.exec(courseId);
	if (num) num = Math.round(num[0]);
	return num;
}

function getSeq(courseId) {
	if (!courseId) return null;
	var seq = seqRegExp.exec(courseId);
	if (seq) seq = seq[0].toUpperCase();
	return seq;
}

var TROJAN = {};

/* ————— STANDARD FUNCTIONS ————— */

TROJAN.terms = function () {
  return urlparse('/terms').then(function (termsResponse) {
	  return new Promise(function (resolve, reject) {
      resolve({
				type: 'active_terms_object',
				ts: Date.now(),
				command: 'terms',
				terms: termsResponse.term.map(function (term) {
	        return parseInt(term);
	      })
			});
    });
  });
};

TROJAN.current_term = function () {
  return TROJAN.terms().then(function (activeTermsObject) {
	  return new Promise(function (resolve, reject) {
			var terms = activeTermsObject.terms;
			var currentTerm = terms[terms.length - 1]
      resolve({
				type: 'single_term_object',
				ts: Date.now(),
				command: 'current_term',
				term: currentTerm
			});
    });
  });
};

TROJAN.depts = function (options) {
	options = options || {};
	if ('term' in options) {
		return getDepts({
			type: 'single_term_object',
			term: options['term']
		});
	} else {
		return TROJAN.current_term().then(getDepts);
	}

  function getDepts(singleTermObject) {
		var term = singleTermObject.term;
    return urlparse('/depts/' + term, options.refresh)
			.then(function returnDeptsObject(res) {
				return new Promise(function (resolve, reject) {
		      resolve({
						type: 'departments_list_object',
						ts: Date.now(),
						command: 'depts',
						departments: normalize.depts(res.department)
					});
		    });
			});
  }
};

TROJAN.dept = function (dept, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

  if (term) {
		return getClasses({
			type: 'single_term_object',
			term: term
		});
	} else {
		return TROJAN.current_term().then(getClasses);
	}

	function getClasses(singleTermObject) {
		var term = singleTermObject.term;
    return urlparse('/classes/' + dept + '/' + term, refresh)
			.then(function returnDept(res) {
				return new Promise(function (resolve, reject) {
	        resolve({
						type: 'department_object',
						ts: Date.now(),
						command: 'dept',
						department: normalize.classes(res)
					});
				});
      });
  }
};

TROJAN.session = function (session, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

	if (term) {
		return getSessionInfo({
			type: 'single_term_object',
			term: term
		});
	} else {
		return TROJAN.current_term().then(getSessionInfo);
	}

  function getSessionInfo(singleTermObject) {
		var term = singleTermObject.term;
    return urlparse('/session/' + session + '/' + term, refresh)
			.then(function returnSess(res) {
		  return new Promise(function (resolve, reject) {
	      if (_.isEmpty(res)) reject('Not a valid session.');
	      resolve({
					type: 'session_object',
					ts: Date.now(),
					command: 'session',
					session: normalize.session(res)
				});
	    });
	  });
  }
};

TROJAN.booklist = function (section, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

	if (term) {
		return getBookList({
			type: 'single_term_object',
			term: term
		});
	} else {
		return TROJAN.current_term().then(getBookList);
	}

  function getBookList(singleTermObject) {
		var term = singleTermObject.term;
    return urlparse('/booklist/' + section + '/' + term, refresh)
			.then(function returnBooklist(res) {
		  return new Promise(function (resolve, reject) {
        resolve({
					type: 'booklist_object',
					ts: Date.now(),
					command: 'booklist',
					booklist: normalize.booklist(res)
				});
		  });
    });
  }
};

TROJAN.courses = function (dept, options) {
	if (_.isObject(dept)) return returnCourses(dept);
	else return TROJAN.dept(dept, options).then(returnCourses);

  function returnCourses(departmentObject) {
	  return new Promise(function (resolve, reject) {
      resolve ({
				type: 'courses_object',
				ts: Date.now(),
				command: 'courses',
				courses: departmentObject.department.courses
			});
	  });
	}
};

TROJAN.dept_info = function (dept, options) {
  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnDeptInfo(dept);
    else TROJAN.dept(dept, options).then(returnDeptInfo).catch(reject);

    function returnDeptInfo(departmentObject) {
      resolve({
				type: 'department_meta_object',
				ts: Date.now(),
				command: 'dept_info',
				meta: departmentObject.department.meta
			});
    }
  });
};

/* ————— QUERYING ————— */

TROJAN.course = function (courseIdObject, options) {
	if (_.isString(courseIdObject)) courseIdObject = TROJAN.parseCourseId(courseIdObject);

	if (courseIdObject['type'] == 'courses_object') {
		return returnCourse(courseIdObject);
	} else if (courseIdObject['type'] == 'course_id_object'){
		return TROJAN.courses(courseIdObject.dept, options).then(returnCourse);
	}

  function returnCourse(coursesObject) {
		var dept = courseIdObject.dept,
				num = courseIdObject.num,
				seq = courseIdObject.seq,
				courseId = courseIdObject.courseId;
	  return new Promise(function (resolve, reject) {
      var toResolve = {};

      var seq = seq || '';
      if (!_.isUndefined(coursesObject[courseId])) {
        toResolve[courseId] = coursesObject[courseId];
      } else {
        // for each matching query, append to object
        _.forEach(coursesObject.courses, function (val, key) {
          if (val.number == num) {
            if (seq) {
              if (val.sequence == seq) {
                toResolve[key] = val;
              }
            } else {
              toResolve[key] = val;
            }
          }
        });
      }

      resolve({
				type: 'courses_object',
				ts: Date.now(),
				command: 'course',
				courses: toResolve
			});
	  });
  }
};

TROJAN.section = function (courseIdObject, sectionId, options) {
	if (_.isString(courseIdObject)) courseIdObject = TROJAN.parseCourseId(courseIdObject);

	if (courseIdObject['type'] == 'courses_object') {
		return returnSection(courseIdObject);
	} else if (courseIdObject['type'] == 'course_id_object'){
		return TROJAN.course(courseIdObject, options).then(returnSection);
	}

  function returnSection(coursesObject) {
		var courses = coursesObject.courses;
		return new Promise(function (resolve, reject) {
      _.forEach(courses, function (val, key) {
        if (val.sections) {
          _.forEach(val.sections, function (sval, skey) {
            if (skey == sectionId) {
							resolve({
								type: 'section_object',
								ts: Date.now(),
								command: 'section',
								section: sval
							});
						}
          });
        }
      });
	  });
	}
};

/* ————— TRANSFORMED FUNCTIONS ————— */

TROJAN.depts_flat = function (options) {
  return TROJAN.depts(options).then(function (departmentsObject) {
		var departments = departmentsObject.departments;
		return new Promise(function (resolve, reject) {
			var toResolve = {};

			function findDeptNRecurse(departments) {
				_.forEach(departments, function (val, key) {
					toResolve[key] = {
						name: val.name,
						type: val.type,
					};

					if (val.depts) {
						findDeptNRecurse(val.depts);
					}
				});
			}

			findDeptNRecurse(departments);
			resolve({
				type: 'departments_list_object',
				ts: Date.now(),
				command: 'depts_flat',
				departments: toResolve
			});
		});
	});
};

TROJAN.deptsY = function (options) {
    return TROJAN.depts_flat(options).then(function (departmentsObject) {
		  return new Promise(function (resolve, reject) {
	      var toResolve = {};
				var departments = departmentsObject.departments;
	      _.forEach(departments, function (val, key) {
	        if (val.type == 'Y')
	        toResolve[key] = val.name;
	      });

	      resolve({
					type: 'departments_list_object',
					ts: Date.now(),
					command: 'deptsY',
					departments: toResolve
				});
		  });
    });
};

TROJAN.deptsC = function (options) {
	return TROJAN.depts_flat(options).then(function (departmentsObject) {
	  return new Promise(function (resolve, reject) {
      var toResolve = {};
			var departments = departmentsObject.departments;
      _.forEach(departments, function (val, key) {
        if (val.type == 'C')
        toResolve[key] = val.name;
      });

			resolve({
				type: 'departments_list_object',
				ts: Date.now(),
				command: 'deptsY',
				departments: toResolve
			});
    });
  });
};

TROJAN.deptsN = function (options) {
	return TROJAN.depts_flat(options).then(function (departmentsObject) {
	  return new Promise(function (resolve, reject) {
      var toResolve = {};
			var departments = departmentsObject.departments;
      _.forEach(departments, function (val, key) {
        if (val.type == 'N')
        toResolve[key] = val.name;
      });

			resolve({
				type: 'departments_list_object',
				ts: Date.now(),
				command: 'deptsY',
				departments: toResolve
			});
    });
  });
};

TROJAN.deptsCN = function (options) {
	return TROJAN.depts_flat(options).then(function (departmentsObject) {
	  return new Promise(function (resolve, reject) {
      var toResolve = {};
			var departments = departmentsObject.departments;
      _.forEach(departments, function (val, key) {
        if (val.type == 'C' || val.type == 'N')
        toResolve[key] = val.name;
      });

			resolve({
				type: 'departments_list_object',
				ts: Date.now(),
				command: 'deptsY',
				departments: toResolve
			});
    });
  });
};

TROJAN.deptBatch_cb = function (depts, options, resolve, reject) {
	options = options || {};
  var term = options.term, refresh = options.refresh;

  reject = reject || function (e) { console.error(e.stack) }
  function getClasses(termObject) {
    var options = {
      term: termObject.term,
      refresh: refresh
    };
    _.forEach(depts, function (dept) {
      TROJAN.dept(dept, options).then(function (data) {
        resolve(data);
      }).catch(reject);
    });
  }

  if (term) getClasses({ type: 'single_term_object', term });
  else {
    TROJAN.current_term().then(getClasses).catch(reject);
  }
};

TROJAN.deptBatch = function (depts, options) {
  return new Promise(function (resolve, reject) {
    var object = {};
    TROJAN.deptBatch_cb(depts, options, function (data) {
      object[data.meta.abbreviation] = data;
      if (Object.keys(object).length == depts.length) {
        resolve(object);
      }
    }, reject);
  });
};

TROJAN.combinations = function (coursedata) {
  return new Promise(function (resolve) {
    resolve(TROJAN.combinations_async(coursedata));
  });
};

TROJAN.combinations_async = function (coursedata) {
  var sections = coursedata.sections;
  var object = combinations.generate(sections);
  return object;
};

TROJAN.parseCourseId = function (courseIdString) {
	if (_.isObject(courseIdString)) return courseIdString;
	var dept = getDept(courseIdString);
	var num = getNum(courseIdString);
	var seq = getSeq(courseIdString);
	return {
		type: 'course_id_object',
		ts: Date.now(),
		command: 'parseCourseId',
		dept: dept,
		num: num,
		seq: seq,
		course_id: dept + '-' + num + (seq || '')
	};
}

/* ————— EXPORT ————— */

module.exports = TROJAN;
