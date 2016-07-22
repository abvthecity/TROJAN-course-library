'use strict';
var _ = require('lodash');
var Promise = require('promise');
var urlparse = require('./src/urlparse');
var normalize = require('./src/normalize');

var TROJAN = {};

/* ————— STANDARD FUNCTIONS ————— */

TROJAN.terms = function () {
  return new Promise(function (resolve, reject) {
    urlparse('/terms').then(function (res) {
      resolve(res.term);
    }, reject);
  });
};

TROJAN.current_term = function () {
  return new Promise(function (resolve, reject) {
    TROJAN.terms().then(function (res) {
      resolve(res[res.length - 1]);
    }, reject);
  });
};

TROJAN.depts = function (term) {
  return new Promise(function (resolve, reject) {
    function getDepts(term) {
      urlparse('/depts/' + term).then(function (res) {
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
      urlparse('/classes/' + dept + '/' + term).then(function (res) {
        resolve(normalize.classes(res));
      }, reject);
    }

    if (term) getClasses(term);
    else TROJAN.current_term().then(getClasses, reject);
  });
};

TROJAN.courses = function (dept, term) {
  return new Promise(function (resolve, reject) {
    TROJAN.dept(dept, term).then(function (data) {
      resolve(data.courses);
    });
  });
};

TROJAN.dept_info = function (dept, term) {
  return new Promise(function (resolve, reject) {
    TROJAN.dept(dept, term).then(function (data) {
      resolve(data.meta);
    });
  });
};

/* ————— QUERYING ————— */

TROJAN.course = function (dept, num, seq, term) {
  return new Promise(function (resolve, reject) {
    TROJAN.courses(dept, term).then(function (data) {
      var object = {};
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

      resolve(object);
    });
  });
};

TROJAN.section = function (dept, num, seq, sect, term) {
  return new Promise(function (resolve, reject) {
    TROJAN.course(dept, num, seq, term).then(function (data) {
      var object = {};
      _.forEach(data, function (val, key) {
        if (val.sections) {
          _.forEach(val.sections, function (sval, skey) {
            if (skey == sect) resolve(sval);
          });
        }
      });

      resolve(object);
    });
  });
};

/* ————— TRANSFORMED FUNCTIONS ————— */

TROJAN.depts_flat = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts(term).then(function (res) {
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
    });
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

TROJAN.deptBatch_cb = function (depts, term, cb) {
  function getClasses(term) {
    _.forEach(depts, function (dept) {
      TROJAN.dept(dept, term).then(function (data) {
        cb({ dept, data });
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
      object[data.dept] = data.data;
      if (Object.keys(object).length == depts.length) {
        resolve(object);
      }
    });
  });
};

/* ————— EXPORT ————— */

module.exports = TROJAN;
