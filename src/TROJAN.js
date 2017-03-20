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
  return new Promise(function (resolve, reject) {
    urlparse('/terms').then(function returnTerms(res) {
      resolve(res.term.map(function (term) {
        return parseInt(term);
      }));
    }).catch(reject);
  });
};

TROJAN.current_term = function () {
  return new Promise(function (resolve, reject) {
    TROJAN.terms().then(function returnCurrentTerm(res) {
      resolve(res[res.length - 1]);
    }).catch(reject);
  });
};

TROJAN.depts = function (options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

  return new Promise(function (resolve, reject) {
    function getDepts(term) {
      urlparse('/depts/' + term, refresh).then(function returnDeptsObject(res) {
        resolve(normalize.depts(res.department));
      }).catch(reject);
    }

    if (term) getDepts(term);
    else TROJAN.current_term().then(getDepts).catch(reject);
  });
};

TROJAN.dept = function (dept, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

  return new Promise(function (resolve, reject) {
    function getClasses(term) {
      urlparse('/classes/' + dept + '/' + term, refresh).then(function returnDept(res) {
        resolve(normalize.classes(res));
      }).catch(reject);
    }

    if (term) getClasses(term);
    else TROJAN.current_term().then(getClasses).catch(reject);
  });
};

TROJAN.session = function (session, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

  return new Promise(function (resolve, reject) {
    function getSessionInfo(term) {
      urlparse('/session/' + session + '/' + term, refresh).then(function returnSess(res) {
        if (_.isEmpty(res)) reject('Not a valid session.');
        resolve(normalize.session(res));
      }).catch(function (e) {
        reject(new Error('Session ID is invalid'));
      });
    }

    if (term) getSessionInfo(term);
    else TROJAN.current_term().then(getSessionInfo).catch(reject);
  });
};

TROJAN.booklist = function (section, options) {
	options = options || {};
	var term = options.term, refresh = options.refresh;

  return new Promise(function (resolve, reject) {
    function getBookList(term) {
      urlparse('/booklist/' + section + '/' + term, refresh).then(function returnBooklist(res) {
        resolve(normalize.booklist(res));
      }).catch(function (e) {
        reject('No booklist found.');
      });
    }

    if (term) getBookList(term);
    else TROJAN.current_term().then(getBookList).catch(reject);
  });
};

TROJAN.courses = function (dept, options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnCourses(dept);
    else TROJAN.dept(dept, options).then(returnCourses).catch(reject);

    function returnCourses(data) {
      resolve(data.courses);
    }
  });
};

TROJAN.dept_info = function (dept, options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnDeptInfo(dept);
    else TROJAN.dept(dept, options).then(returnDeptInfo).catch(reject);

    function returnDeptInfo(data) {
      resolve(data.meta);
    }
  });
};

/* ————— QUERYING ————— */

TROJAN.course = function (courseId, options) {
	options = options || {};

	courseId = TROJAN.parseCourseId(courseId);
	console.log(courseId);

	var dept = courseId.dept, num = courseId.num, seq = courseId.seq;

  return new Promise(function (resolve, reject) {
    if (!('dept' in courseId)) returnCourse(courseId);
    else TROJAN.courses(dept, options).then(returnCourse).catch(reject);

    function returnCourse(data) {
      var object = {};

      var seq2 = (seq == null) ? '' : seq;
      if (!_.isUndefined(data[dept + '-' + num + seq2])) {
        object[dept + '-' + num + seq2] = data[dept + '-' + num + seq2];
      } else {
        // for each matching query, append to object
        _.forEach(data, function (val, key) {
          if (val.number == num) {
            if (seq) {
              if (val.sequence == seq) {
                object[key] = val;
              }
            } else {
              object[key] = val;
            }
          }
        });
      }

      resolve(object);
    }
  });
};

TROJAN.section = function (courseId, sect, options) {
	options = options || {};

	courseId = TROJAN.parseCourseId(courseId);
	var dept = courseId.dept, num = courseId.num, seq = courseId.seq;

  return new Promise(function (resolve, reject) {
    if (!('dept' in courseId)) returnSection(courseId);
    else TROJAN.course(courseId, options).then(returnSection).catch(reject);

    function returnSection(data) {
      _.forEach(data, function (val, key) {
        if (val.sections) {
          _.forEach(val.sections, function (sval, skey) {
            if (skey == sect) resolve(sval);
          });
        }
      });
    }
  });
};

/* ————— TRANSFORMED FUNCTIONS ————— */

TROJAN.depts_flat = function (options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    if (_.isObject(term)) returnDeptsFlat(term);
    else TROJAN.depts(options).then(returnDeptsFlat).catch(reject);

    function returnDeptsFlat(res) {
      var object = {};

      function findDeptNRecurse(res) {
        _.forEach(res, function (val, key) {
          object[key] = {
            name: val.name,
            type: val.type,
          };

          if (val.depts) {
            findDeptNRecurse(val.depts);
          }
        });
      }

      findDeptNRecurse(res);
      resolve(object);
    }
  });
};

TROJAN.deptsY = function (options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(options).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'Y')
        object[key] = val.name;
      });

      resolve(object);
    }).catch(reject);
  });
};

TROJAN.deptsC = function (options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(options).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'C')
        object[key] = val.name;
      });

      resolve(object);
    }).catch(reject);
  });
};

TROJAN.deptsN = function (options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(options).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'N')
        object[key] = val.name;
      });

      resolve(object);
    }).catch(reject);
  });
};

TROJAN.deptsCN = function (options) {
	options = options || {};

  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(options).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'C' || val.type == 'N')
        object[key] = val.name;
      });

      resolve(object);
    }).catch(reject);
  });
};

TROJAN.deptBatch_cb = function (depts, options, cb, reject) {
	options = options || {};

  reject = reject || function (e) { console.error(e.stack) }
  function getClasses(term) {
    _.forEach(depts, function (dept) {
      TROJAN.dept(dept, options).then(function (data) {
        cb(data);
      }).catch(reject);
    });
  }

  if (term) getClasses(term);
  else {
    TROJAN.current_term().then(getClasses).catch(reject);
  }
};

TROJAN.deptBatch = function (depts, options) {
	options = options || {};

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

TROJAN.parseCourseId = function (courseId) {
	if (_.isObject(courseId)) return courseId;
	return {
		dept: getDept(courseId),
		num: getNum(courseId),
		seq: getSeq(courseId)
	};
}

/* ————— EXPORT ————— */

module.exports = TROJAN;
