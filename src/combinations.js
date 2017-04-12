var _ = require('lodash');
var sectionConflictExists = require('./sectionConflictExists');

var combinations = {};

var immediatelyRegEx = new RegExp('immediately', 'i');

combinations.generate = function (sections) {
  var buckets = combinations.buckets(sections);

  // Find combinations using a queue and BFS
  var results = [];

  // repeat for each bucket
  _.forEach(buckets, function (bucket) {
    var queue = [[]];
    var left = 0; // to remove from queue

    var goalSize = Object.keys(bucket).length;
    var currSize = 0;

    // ensure each result is the same size
    while (currSize < goalSize) {
      var queueLength = queue.length; // make copy
      // for each item in the queue
      for (var i = left; i < queueLength; i++) {
        var type = Object.keys(bucket)[currSize];

        for (var j = 0; j < bucket[type].length; j++) {
          var temp = queue[i].slice() || [];
          var noConflicts = true;

          // check conflicts
          var sA = bucket[type][j];
          _.forEach(temp, function (sB) {
            if (sectionConflictExists(sections[sA], sections[sB]))
              noConflicts = false;
          });

          if (noConflicts) {
            temp.push(sA);
            queue.push(temp);
          }
        }

        left++;
      }

      currSize++;
    }

    queue.splice(0, left);
    results = results.concat(queue);
  });

  return results;
};

combinations.buckets = function (sections) {
  // restructure list of sections into "buckets".
  var sectionOrder     = combinations.sectionOrder(sections);
  var typeOrder        = combinations.typeOrder(sections, sectionOrder);
  var orderIsImportant = combinations.orderIsImportant(sections, sectionOrder, typeOrder);

  // Buckets represent each separate set of sections which we want to analyze.
  // In most cases, having multiple buckets won't matter. But for the unlucky
  // few esp. ones that say: "choose 1 lec and 1 lab directly underneath",
  // we need to identify all the different "buckets" so that we don't return
  // course combinations that don't work in actuality.
  var buckets = [];

  // Whether we have multiple buckets or one bucket, we may have a quiz section
  // that applies to all buckets. This is extremely rare, but for safety...
  var quiz = [];

  // Online courses (such as DEN@VITERBI) cannot mix with other sections.
  // We will check IsDistanceLearning and place those sections here.
  var den = {}; // distance learning bucket

  // So for every section, we want to insert to a bucket in an array of sections
  // with the same label. Essentially grouping Lec together, or Lab together.
  // This will make writing the matching section BFS algorithm slightly easier.
  var bucket = {};
  for (var i in sectionOrder) {

    // check if we should be creating new buckets
    if (!_.isEmpty(bucket)
      && orderIsImportant
      && typeOrder[i] == typeOrder[0] // every round
    ) {
      buckets.push(bucket);
      bucket = {};
    }

    if (!_.isEmpty(bucket)
      && typeOrder[i].indexOf('-') > -1) { // lec-lab / lec-dis appearances)
      buckets.push(bucket);
      bucket = {};
    }

    // check if this section should go to its own bucket.
    if (sections[sectionOrder[i]].IsDistanceLearning
      || sections[sectionOrder[i]].location == 'DEN@Viterbi') {
      den[typeOrder[i]] = den[typeOrder[i]] || [];
      den[typeOrder[i]].push(sectionOrder[i]);
      continue;
    }

    // check if we should be pushing quiz separately.
    if (typeOrder[i] == 'Qz') {
      quiz.push(sectionOrder[i]);
      continue;
    }

    // the main function: push to bucket.
    bucket[typeOrder[i]] = bucket[typeOrder[i]] || [];
    bucket[typeOrder[i]].push(sectionOrder[i]);
    // console.log(bucket);
  }

  // reconciliation:

  if (!_.isEmpty(bucket)) {
    buckets.push(bucket);
  }

  if (!_.isEmpty(quiz)) {
    for (var i in buckets) {
      buckets[i].Qz = quiz;
    }
  }

  if (!_.isEmpty(den)) {
    buckets.push(den);
  }

  return buckets;
};

combinations.orderIsImportant = function (sections, sectionOrder, typeOrder) {
  // quickly determine if a course has rigid or random section-choosing structure
  // true: order does matter
  // false: order does not matter
  sectionOrder = sectionOrder || combinations.sectionOrder(sections);
  typeOrder = typeOrder || combinations.typeOrder(sections, sectionOrder);

  for (var key in sectionOrder) {
    var desc = sections[sectionOrder[key]].description;
    if (desc != null && immediatelyRegEx.test(desc)) {
      // to omit those weird ones...
      if (typeOrder[0] != typeOrder[1]) {
        return true;
      }
    }
  }

  return false;
};

combinations.typeCount = function (sections, typeOrder) {
  // get the # of occurrances for each type
  typeOrder = typeOrder || combinations.typeOrder(sections);
  return _.countBy(typeOrder);
};

combinations.typeOrder = function (sections, sectionOrder) {
  // get the types of each section in order
  sectionOrder = sectionOrder || combinations.sectionOrder(sections);
  return _.map(sectionOrder, function returnType(section) {
    return sections[section].type;
  });
};

combinations.sectionOrder = function (sections) {
  // get the section ID array in sorted order

  // 1. sort, with dclass_code
  sectionKeys = Object.keys(sections);
  var sectionOrder = _.map(sectionKeys, function (key) {
    // if (sections[key].dclass_code == null) sections[key].dclass_code = 'A';
    // return sections[key].dclass_code + key;
    return key;
  }).sort();

  // 2. remove dclass_code
  return _.map(sectionOrder, function returnCleanSection(key) {
    return key.slice(0);
  });
};

module.exports = combinations;
