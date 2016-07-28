var _ = require('lodash');

function sectionConflictExists(a, b) {
  // returns true if there is a conflict

  if (!_.isArray(a.day)) {
    a.day = [a.day];
    a.start_time = [a.start_time];
    a.end_time = [a.end_time];
  }

  if (!_.isArray(b.day)) {
    b.day = [b.day];
    b.start_time = [b.start_time];
    b.end_time = [b.end_time];
  }

  for (var i in a.day) {
    for (var j in b.day) {
      if (dayConflictExists(a.day[i], b.day[j])) {
        var timeConflictDoesExist = timeConflictExists(
          a.start_time[i],
          a.end_time[i],
          b.start_time[j],
          b.end_time[j]
        );

        if (timeConflictDoesExist)
          return true;
      }
    }
  }

  return false;
};

function dayConflictExists(day1, day2) {
  if (day1 == null || day2 == null) {
    return false;
  }

  // returns true if there is a conflict
  for (var key in Object.keys(day1)) {
    if (day1[key] && day2[key]) return true;
  }

  return false;
}

function timeConflictExists(start1, end1, start2, end2) {
  if (start1 == null || start2 == null) {
    return false;
  }

  start1 = convertToMin(start1);
  end1 = convertToMin(end1);
  start2 = convertToMin(start2);
  end2 = convertToMin(end2);

  // returns true if there is a conflict
  if (start1 == start2) return true;

  if (start1 < start2) {
    return (end1 > start2);
  }

  if (start2 < start1) {
    return (end2 > start1);
  }
}

function convertToMin(time) {
  // ex: convert '13:50' to '830'
  var time = time.split(':');
  return Math.round(time[0]) * 60 + Math.round(time[1]);
}

module.exports = sectionConflictExists;
