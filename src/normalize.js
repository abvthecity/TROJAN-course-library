var _ = require('lodash');

// this file try to normalize data with custom data models:

var normalize = {};

normalize.course = function (data) {
  var object = {};
  object[str(data.PublishedCourseID)] = {
    isCrossListed: str(data.IsCrossListed),
    courseId: str(data.ScheduledCourseID),
    prefix: str(data.CourseData.prefix),
    number: str(data.CourseData.number),
    sequence: str(data.CourseData.sequence),
    suffix: str(data.CourseData.suffix),
    title: str(data.CourseData.title),
    description: str(data.CourseData.description),
    units: str(data.CourseData.units),
    restrictions: {
      major: str(data.CourseData.restriction_by_major),
      class: str(data.CourseData.restriction_by_class),
      school: str(data.CourseData.restriction_by_school),
    },
    CourseNotes: str(data.CourseData.CourseNotes),
    CourseTermNotes: str(data.CourseData.CourseTermNotes),
    prereq_text: str(data.CourseData.prereq_text),
    coreq_text: str(data.CourseData.coreq_text),
    sections: normalize.sectionArray(data.CourseData.SectionData),
  };
  return object;
};

normalize.section = function (data) {
  var object = {};
  object[str(data.id)] = {
    session: str(data.session),
    dclass_code: str(data.dclass_code),
    title: str(data.title),
    section_title: str(data.section_title),
    description: str(data.description),
    notes: str(data.notes),
    type: str(data.type),
    units: str(data.units),
    spaces_available: str(data.spaces_available),
    number_registered: str(data.number_registered),
    wait_qty: str(data.wait_qty),
    canceled: str(data.canceled),
    blackboard: str(data.blackboard),
    fee: {
      description: (data.fee) ? str(data.fee.description) : null,
      amount: (data.fee) ? str(data.fee.amount) : null,
    },
    day: convertDays(str(data.day)),
    start_time: str(data.start_time),
    end_time: str(data.end_time),
    location: str(data.location),
    instructor: {
      last_name: (data.instructor) ? str(data.instructor.last_name) : null,
      first_name: (data.instructor) ? str(data.instructor.first_name) : null,
      bio_url: (data.instructor) ? str(data.instructor.bio_url) : null,
    },
    syllabus: {
      format: (data.syllabus) ? str(data.syllabus.format) : null,
      filesize: (data.syllabus) ? str(data.syllabus.filesize) : null,
    },
    IsDistanceLearning: str(data.IsDistanceLearning),
  };
  return object;
};

normalize.deptInfo = function (data) {
  return {
    department: str(data.department),
    abbreviation: str(data.abbreviation),
    phone_number: str(data.phone_number),
    address: str(data.address),
    ugrad_dclass_phone_number: str(data.ugrad_dclass_phone_number),
    ugrad_dclass_address: str(data.ugrad_dclass_address),
    grad_dclass_phone_number: str(data.grad_dclass_phone_number),
    grad_dclass_address: str(data.grad_dclass_address),
    Notes: str(data.Notes),
    TermNotes: str(data.TermNotes),
  };
};

normalize.courseArray = function (data) {
  if (_.isObject(data)) {
    if (_.isEmpty(data)) {
      return null;
    }
  }

  var object = {};
  if (_.isArray(data)) {
    _.map(data, function (item) {
      _.assign(object, normalize.course(item));
    });
  } else {
    _.assign(object, normalize.course(data));
  }

  return object;
};

normalize.sectionArray = function (data) {
  if (_.isObject(data)) {
    if (_.isEmpty(data)) {
      return null;
    }
  }

  var object = {};
  if (_.isArray(data)) {
    _.map(data, function (item) {
      _.assign(object, normalize.section(item));
    });
  } else {
    _.assign(object, normalize.section(data));
  }

  return object;
};

normalize.classes = function (data) {
  var ts = Date.parse(data.schd_sync_dtm);
  var courses = (str(data.OfferedCourses))
    ? normalize.courseArray(data.OfferedCourses.course) : null;
  var meta = normalize.deptInfo(data.Dept_Info);
  return { ts, meta, courses };
};

normalize.depts = function (data) {
  var object = {};
  _.map(data, function (deptY) {
    var depts = {};
    if (!_.isArray(deptY.department)) {
      if (_.isObject(deptY.department)) {
        deptY.department = [deptY.department];
      } else {
        depts = null;
      }
    }

    _.map(deptY.department, function (deptN) {
      depts[deptN.code] = {
        name: str(deptN.name),
        type: deptN.type,
      };
    });

    object[deptY.code] = {
      name: str(deptY.name),
      type: deptY.type,
      depts,
    };
  });

  return object;
};

module.exports = normalize;

function str(data) {
  if (typeof data === 'undefined') return null;
  if (data == '' || data == 'TBA') return null;
  if (data == 'N') return false;
  if (data == 'Y') return true;

  if (_.isObject(data)) {
    if (_.isEmpty(data)) {
      return null;
    }
  }

  return data;
}

function convertDays(day) {
  if (day == null) return;
  return {
    M: (day.indexOf('M') > -1),
    T: (day.indexOf('T') > -1),
    W: (day.indexOf('W') > -1),
    H: (day.indexOf('H') > -1),
    F: (day.indexOf('F') > -1),
    S: (day.indexOf('S') > -1),
    U: (day.indexOf('U') > -1),
  };
}
