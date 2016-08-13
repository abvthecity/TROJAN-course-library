# TROJAN Course API v2

TROJAN Course API is fast, asyncronous, unofficial course catalogue API that can be used to develop course tools for USC with javascript. In version 2, I've re-wrote every method from scratch. Here's why:

1. Data coming from the official API is not normalized. Some values disappear, other values would change from string to object. All data in this API has been transformed and normalized so you don't have to worry.
2. Now using Promises instead of Async. The previous implementation was too messy to interface with.
3. AJAX throttling. I've wrote the requests to USC's server to be fail-proof. Meaning, as soon as we get an error from the server, it will try again.

## Basic usage
```javascript
  var TROJAN = require('trojan-course-api');
  ....
```

### Methods
* standard
  * terms()
  * current_term()
  * depts(term)
  * dept(dept, term)
  * courses(dept, term)
  * dept_info(dept, term)
* querying
  * course(dept, num, seq, term)
  * section(dept, num, seq, sect, term)
* transforming
  * depts_flat(term)
  * deptsY(term)
  * deptsC(term)
  * deptsN(term)
  * deptsCN(term)
  * deptBatch_cb(array_of_depts, term, callback)
  * deptBatch(array_of_depts, term)
  * combinations(sections);

*NOTE: including `term` as a parameter is always optional. If you leave it out, the current-most term will be used. However, that means performing more server GET requests, so it's gonna be slightly slower.*

### terms()
```javascript
TROJAN.terms().then(console.log);
```
```javascript
['20161', '20162', '20163']
```

### current_term()
```javascript
TROJAN.current_term().then(console.log);
```
```javascript
20163
```

### depts(term)
Gets you an object of all the departments. There are two levels apparently of departments nested within departments (usually school code).
```javascript
TROJAN.depts().then(console.log);
```
```javascript
{ DRNS:
  { name: 'Dornsife College of Letters, Arts and Sciences',
    type: 'Y',
    depts:
    { AHIS: [Object],
      ALI: [Object],
      ... } }
  ... }
```

### dept(dept, term)
Get a snapshot of the department, its info, and its courses
```javascript
TROJAN.dept('CSCI').then(console.log);
```
```javascript
{
  ts: 1469142625000, // when this database was last updated
  meta: {...}, // info about the department itself
  courses: {...}, // all courses under this dept
}
```

### courses(dept, term)
You can also get here by `dept(dept, term)` -> `.courses`.
```javascript
TROJAN.courses('CSCI').then(console.log);
```
```javascript
{ 'CSCI-100':
  { isCrossListed: false,
    courseId: 'CSCI-100',
    prefix: 'CSCI',
    number: '100',
    sequence: null,
    suffix: 'xg',
    title: 'Explorations in Computing',
    description: 'A behind-the-scenes overview of the computational/algorithmic principles that form the basis of today&apos;s digital society. Exploration areas include social media, web search, videogames and location-based services.',
    units: '4.0, 0',
    restrictions: [Object],
    CourseNotes: null,
    CourseTermNotes: null,
    prereq_text: null,
    coreq_text: null,
    sections: [Object] },
  ... }
```

### dept_info(dept, term)
You can also get here by `dept(dept, term)` -> `.meta`.
```javascript
TROJAN.dept_info('CSCI').then(console.log);
```
```javascript
{ department: 'Computer Science',
  abbreviation: 'CSCI',
  phone_number: '   -    ',
  address: null,
  ugrad_dclass_phone_number: '(213)740-4494',
  ugrad_dclass_address: 'SAL 104',
  grad_dclass_phone_number: '   -    ',
  grad_dclass_address: null,
  Notes: 'D class assignments for undergraduates are available via email at: csdept@usc.edu. D class assignments for graduate students are only available on line at: myviterbi.usc.edu. Once you create your myViterbi profile, select the "D-Clearance Request Manager" to submit requests for graduate CSCI courses. To be enrolled in an off-campus course, you MUST also be enrolled in the Distance Education Network (DEN). For more information, call 740-4488 or go to den.usc.edu. DEN courses are indicated by a location of DEN@Viterbi.',
  TermNotes: null }
```

### course(dept, num, seq, term)
```javascript
TROJAN.course('CTAN', '450').then(console.log);
```
```javascript
{ 'CTAN-450A':
  { isCrossListed: false,
    courseId: 'CTAN-450A',
    prefix: 'CTAN',
    number: '450',
    sequence: 'A',
    suffix: null,
    title: 'Animation Theory and Techniques',
    description: 'Methods for creating animation blending traditional techniques with contemporary technologies.',
    units: '2.0',
    restrictions: { major: null, class: null, school: null },
    CourseNotes: null,
    CourseTermNotes: null,
    prereq_text: null,
    coreq_text: null,
    sections: { '17874': [Object] } },
  'CTAN-450B':
  { isCrossListed: false,
    courseId: 'CTAN-450B',
    prefix: 'CTAN',
    number: '450',
    sequence: 'B',
    suffix: null,
    title: 'Animation Theory and Techniques',
    description: 'Instruction in methods for planning and executing a short animated film. Topics covered include storyboarding, visual development and production planning.',
    units: '2.0',
    restrictions: { major: null, class: null, school: null },
    CourseNotes: null,
    CourseTermNotes: null,
    prereq_text: 'CTAN-450A',
    coreq_text: null,
    sections: { '17880': [Object] } } }
```

### section(dept, num, seq, sect, term)
```javascript
TROJAN.section('CTAN', 450, 'A', 17874).then(console.log);
```
```javascript
{ session: '001',
  dclass_code: 'R',
  title: 'Animation Theory and Techniques',
  section_title: null,
  description: null,
  notes: null,
  type: 'Lec-Lab',
  units: '2.0',
  spaces_available: '15',
  number_registered: '4',
  wait_qty: '0',
  canceled: false,
  blackboard: false,
  fee: { description: null, amount: null },
  block: [ { day: [ 'W' ], start: '13:00', end: '15:50', location: 'RZC117' },
    { day: [ 'F' ], start: '09:00', end: '11:50', location: 'SCB102' } ],
  instructor:
    { last_name: 'Smith',
      first_name: 'Kathy',
      bio_url: 'http://www.kathymoods.org' },
  syllabus: { format: null, filesize: null },
  IsDistanceLearning: false }
```

### depts_flat(term)
Recursively flattens the object of departments from `dept(term)`.

### deptsY(term)
Outputs an object of departments of type Y.

### deptsC(term)
Outputs an object of departments of type C.

### deptsN(term)
Outputs an object of departments of type N.

### deptBatch(array_of_depts)
Given an input of, for example, `['CSCI', 'EE', 'BISC']`, you will get all the `dept(dept, term)` for each in a single object.

### combinations(coursedata)
Given an input of an object of a course (which is usually returned by course()), this will give an output array of all the possible section combinations of the course. For example, inputting the course data for `ISE-570` will return:
```javascript
[ [ 30101, 29911, 29923 ],
  [ 30101, 29912, 29923 ],
  [ 30101, 29915, 29923 ],
  [ 30101, 29928, 29923 ],
  [ 30101, 30000, 29923 ],
  [ 30101, 30107, 29923 ],
  [ 30101, 30199, 29923 ],
  [ 30101, 30204, 29923 ],
  [ 30101, 30271, 29923 ],
  [ 30101, 30287, 29923 ],
  [ 30101, 30290, 29923 ],
  [ 30101, 30291, 29923 ],
  [ 30101, 30292, 29923 ],
  [ 30101, 30293, 29923 ],
  [ 30101, 30294, 29923 ],
  [ 30101, 30399, 29923 ],
  [ 30102, 29911, 29923 ],
  [ 30102, 29912, 29923 ],
  [ 30102, 29915, 29923 ],
  [ 30102, 29928, 29923 ],
  [ 30102, 30000, 29923 ],
  [ 30102, 30107, 29923 ],
  [ 30102, 30199, 29923 ],
  [ 30102, 30204, 29923 ],
  [ 30102, 30271, 29923 ],
  [ 30102, 30287, 29923 ],
  [ 30102, 30290, 29923 ],
  [ 30102, 30291, 29923 ],
  [ 30102, 30292, 29923 ],
  [ 30102, 30293, 29923 ],
  [ 30102, 30294, 29923 ],
  [ 30102, 30399, 29923 ],
  [ 30099, 30152, 30253 ] ]
```
You're welcome.

## Conclusion

Thanks for taking a look at this API. Please use it responsibly!

Authored by Andrew Jiang.
