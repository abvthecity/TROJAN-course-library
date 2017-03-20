var _ = require('lodash');

// this file try to normalize data with custom data models:

var normalize = {};

normalize.course = function (data) {
  var object = {};
  object[str(data.PublishedCourseID)] = {
    isCrossListed: (str(data.IsCrossListed) == 'Y'),
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
    ConcurrentCourse: (data.ConcurrentCourse) ? str(data.ConcurrentCourse.PublishedCourseID) : null,
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
    canceled: str(data.canceled) == 'Y',
    blackboard: str(data.blackboard) == 'Y',
    fee: normalize.fee(data.fee),
    blocks: normalize.blocks(data.day, data.start_time, data.end_time, data.location),
    instructor: normalize.instructor(data.instructor),
    syllabus: normalize.syllabus(data.syllabus),
    IsDistanceLearning: (str(data.IsDistanceLearning) == 'Y'),
  };
  return object;
};

normalize.blocks = function (day, start, end, location) {
  var blockArray = [];

  day = str(day);
  start = str(start);
  end = str(end);
  location = str(location);

  if (!_.isArray(day)) {
    day = [day];
    start = [start];
    end = [end];
    location = [location];
  }

  for (var i in day) {
    var days = convertDays(str(day[i]));
    if (days !== null) {
      for (var j in days) {
        blockArray.push({
          day: days[j],
          start: start[i],
          end: end[i],
          location: location[i],
        });
      }
    } else {
      blockArray.push({
        day: null,
        start: start[i],
        end: end[i],
        location: location[i],
      });
    }
  }

  return blockArray;
};

normalize.syllabus = function (data) {
  if (str(data) === null || str(data.format) === null) return null;

  return {
    format: str(data.format),
    filesize: str(data.filesize),
  };
};

normalize.fee = function (data) {
  if (str(data) === null) return null;

  return {
    description: str(data.description),
    amount: str(data.amount),
  };
};

normalize.instructor = function (data) {
  if (str(data) === null) return null;

  if (_.isArray(data)) {
    return _.map(data, normalize.instructor);
  }

  return {
    last_name: str(data.last_name),
    first_name: str(data.first_name),
    bio_url: str(data.bio_url),
  };
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
  if (str(data) === null) return null;

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
  if (str(data) === null) return null;

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

normalize.session = function (data) {

  function parseDate(date) {
    date = str(date);

    // date = Date.parse(date);
    return date;
  }

  return {
    first_day_of_classes: parseDate(data.first_day_of_classes),
    last_day_to_add: parseDate(data.last_day_to_add),
    last_day_to_drop_without_w: parseDate(data.last_day_to_drop_without_w),
    last_day_to_drop_with_w: parseDate(data.last_day_to_drop_with_w),
    end_of_session: parseDate(data.end_of_session),
    last_day_to_change_enropt: parseDate(data.last_day_to_change_enropt),
  };
};

normalize.booklist = function (data) {

  if (_.isArray(data)) {
    return _.map(data, normalize.booklist);
  }

  return {
    ISBN: str(data.ISBN),
    Author: str(data.Author),
    Title: str(data.Title),
    Required: (data.Required_or_Optional == 'RQ') ? true : false,
    Price: {
      New: str(data.New_Price),
      Used: str(data.Used_Price),
      Rental_New: str(data.New_Rental_Price),
      Rental_Used: str(data.Used_Rental_Price),
      Ebook: str(data.Ebook_Price),
    },
    Notes: str(data.Notes),
    Comments: str(data.Comments),
  };
};

module.exports = normalize;

function str(data) {
  if (typeof data === 'undefined') return null;
  if (data === '' || data === 'TBA') return null;
  if (_.isObject(data) && _.isEmpty(data)) return null;

  return data;
}

function convertDays(day) {
  if (day == null) return null;
  return _.toArray(day);
}
