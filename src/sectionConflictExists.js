var _ = require('lodash');

function sectionConflictExists(sectionA, sectionB) {
  // returns true if there is a conflict

  for (var a of sectionA.blocks) {
    for (var b of sectionB.blocks) {
      if (dayConflictExists(a.day, b.day)) {
        if (timeConflictExists(
          a.start, a.end, b.start, b.end
        )) return true;
      }
    }
  }

  return false;
};

function dayConflictExists(day1, day2) {
  if (day1 === null || day2 === null) {
    return false;
  }

  return (day1 === day2);
}

function timeConflictExists(start1, end1, start2, end2) {
  if (start1 === null || start2 === null) {
    return false;
  }

  start1 = convertToMin(start1);
  end1 = convertToMin(end1);
  start2 = convertToMin(start2);
  end2 = convertToMin(end2);

  // returns true if there is a conflict
  if (start1 === start2) return true;

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
