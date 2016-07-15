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
        resolve(res.department);
      }, reject);
    }

    if (term) getDepts(term);
    else TROJAN.current_term().then(getDepts, reject);
  });
};

TROJAN.classes = function (dept, term) {
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

/* ————— TRANSFORMED FUNCTIONS ————— */

TROJAN.deptsY = function (term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts(term).then(function (res) {
      var object = {};
      _.map(res, function (Y) {
        object[Y.code] = Y.name;
      });

      resolve(object);
    });
  });
};

TROJAN.deptsN = function (dept, term) {
  return new Promise(function (resolve, reject) {
    TROJAN.depts(term).then(function (res) {
      var object = {};
      _.map(res, function (Y) {
        if (Y.type == 'N') object[Y.code] = Y.name;
        if (!_.isArray(Y.department)) Y.department = [Y.department];
        _.map(Y.department, function (N) {
          if (typeof N === 'undefined') return;
          object[N.code] = N.name;
        });
      });
    });
  });
};

/* ————— EXPORT ————— */

module.exports = TROJAN;
