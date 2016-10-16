'use strict';
var _ = require('lodash');
var Promise = require('bluebird');
var urlparse = require('./urlparse');
var normalize = require('./normalize');
var combinations = require('./combinations');

var TROJAN = {};

/* ————— STANDARD FUNCTIONS ————— */

TROJAN.terms = function () {
  return new Promise(function (resolve, reject) {
    urlparse('/terms').then(function returnTerms(res) {
      resolve(res.term.map(function (term) {
        return parseInt(term);
      }));
    }, reject);
  });
};

TROJAN.current_term = function () {
  return new Promise(function (resolve, reject) {
    TROJAN.terms().then(function returnCurrentTerm(res) {
      resolve(res[res.length - 1]);
    }, reject);
  });
};

TROJAN.depts = function (term) {
  return new Promise(function (resolve, reject) {
    function getDepts(term) {
      urlparse('/depts/' + term).then(function returnDeptsObject(res) {
        resolve(normalize.depts(res.department));
      }, reject);
    }

    if (term) getDepts(term);
    else TROJAN.current_term().then(getDepts, reject);
  });
};

TROJAN.dept = function (dept, term) {
  return new Promise(function (resolve, reject) {
    function getClasses(term) {
      urlparse('/classes/' + dept + '/' + term).then(function returnDept(res) {
        resolve(normalize.classes(res));
      }, reject);
    }

    if (term) getClasses(term);
    else TROJAN.current_term().then(getClasses, reject);
  });
};

TROJAN.session = function (session, term) {
  return new Promise(function (resolve, reject) {
    function getSessionInfo(term) {
      urlparse('/session/' + session + '/' + term).then(function returnSess(res) {
        if (_.isEmpty(res)) reject('Not a valid session.');
        resolve(normalize.session(res));
      },

      function (e) {
        reject('Session ID is invalid.');
      });
    }

    if (term) getSessionInfo(term);
    else TROJAN.current_term().then(getSessionInfo, reject);
  });
};

TROJAN.booklist = function (section, term) {
  return new Promise(function (resolve, reject) {
    function getBookList(term) {
      urlparse('/booklist/' + section + '/' + term).then(function returnBooklist(res) {
        resolve(normalize.booklist(res));
      },

      function (e) {
        reject('No booklist found.');
      });
    }

    if (term) getBookList(term);
    else TROJAN.current_term().then(getBookList, reject);
  });
};

TROJAN.courses = function (dept, term) {
  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnCourses(dept);
    else TROJAN.dept(dept, term).then(returnCourses);

    function returnCourses(data) {
      resolve(data.courses);
    }
  });
};

TROJAN.dept_info = function (dept, term) {
  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnDeptInfo(dept);
    else TROJAN.dept(dept, term).then(returnDeptInfo);

    function returnDeptInfo(data) {
      resolve(data.meta);
    }
  });
};

/* ————— QUERYING ————— */

TROJAN.course = function (dept, num, seq, term) {
  dept = _.upperCase(dept); // insurance
  num = Math.round(num);
  if (_.isString(seq)) seq = _.upperCase(seq); // insurance

  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnCourse(dept);
    else TROJAN.courses(dept, term).then(returnCourse);

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

TROJAN.section = function (dept, num, seq, sect, term) {
  return new Promise(function (resolve, reject) {
    if (_.isObject(dept)) returnSection(dept);
    else TROJAN.course(dept, num, seq, term).then(returnSection);

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

TROJAN.depts_flat = function (term) {
  return new Promise(function (resolve, reject) {
    if (_.isObject(term)) returnDeptsFlat(term);
    else TROJAN.depts(term).then(returnDeptsFlat);

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

TROJAN.deptsY = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(term).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'Y')
        object[key] = val.name;
      });

      resolve(object);
    });
  });
};

TROJAN.deptsC = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(term).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'C')
        object[key] = val.name;
      });

      resolve(object);
    });
  });
};

TROJAN.deptsN = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(term).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'N')
        object[key] = val.name;
      });

      resolve(object);
    });
  });
};

TROJAN.deptsCN = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts_flat(term).then(function (res) {
      var object = {};
      _.forEach(res, function (val, key) {
        if (val.type == 'C' || val.type == 'N')
        object[key] = val.name;
      });

      resolve(object);
    });
  });
};

TROJAN.deptBatch_cb = function (depts, term, cb) {
  function getClasses(term) {
    _.forEach(depts, function (dept) {
      TROJAN.dept(dept, term).then(function (data) {
        cb(data);
      });
    });
  }

  if (term) getClasses(term);
  else TROJAN.current_term().then(getClasses);
};

TROJAN.deptBatch = function (depts, term) {
  return new Promise(function (resolve, reject) {
    var object = {};
    TROJAN.deptBatch_cb(depts, term, function (data) {
      object[data.meta.abbreviation] = data;
      if (Object.keys(object).length == depts.length) {
        resolve(object);
      }
    });
  });
};

TROJAN.combinations_async = function (coursedata) {
  var sections = coursedata.sections;
  var object = combinations.generate(sections);
  return object;
};

TROJAN.combinations = function (coursedata) {
  return new Promise(function (resolve, reject) {
    resolve(TROJAN.combinations_async(coursedata));
  });
};

/* ————— EXPORT ————— */

module.exports = TROJAN;
