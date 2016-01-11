# TROJAN Course API

TROJAN Course API is fast, asyncronous, unofficial course catalogue API that can be used to develop course tools for USC with javascript. 
This API library is written for **NODE.js**. Browser-side javascript is currently not supported due to the nature of the source of data.
If you have a solution, please let me know.

## Basic usage
```javascript
  const TROJAN = require('./TROJAN')
  
  TROJAN.method_name(callback, valobject) // PARAMETERS
  
  TROJAN.term(console.log) // ['20152','20153','20161']
  TROJAN.current_term(console.log) // 20161
  TROJAN.dept_raw(console.log, {term: "20161"}) // each department
  ....
```

Since the entire API runs asynchronously, the methods do not directly return any value. 
This means ```var term = TROJAN.term()``` WILL NOT work.
Instead, each method will return


## Methods
* term
* current_term
* dept_raw
* school
* dept
* dept_info
* course_raw
* course
* sect

### term
The callback(terms) recieves an array of active terms in the database (usually the past 3 terms).

### current_term
The callback(term) recieves the current term as a string. eg. "20161"

### dept_raw
The callback(school) recieves ONE object of each school, which contains an object of each nested department.

**Value Parameters**

* ```{term: "####"}``` *current term is default*

**Example object**

```javascript
{ code: 'FINE',
  name: 'Roski School of Art and Design',
  type: 'Y',
  department: 
   [ { code: 'ART', name: 'Art', type: 'N' },
     { code: 'CRIT', name: 'Critical Studies', type: 'N' },
     { code: 'DES', name: 'Design', type: 'N' },
     { code: 'FA', name: 'Fine Arts', type: 'C' },
     { code: 'FACE', name: 'Ceramics', type: 'C' },
     { code: 'FACS', name: 'Critical Studies', type: 'C' },
     { code: 'FADN', name: 'Design', type: 'C' },
     { code: 'FADW', name: 'Drawing', type: 'C' },
     { code: 'FAIN', name: 'Intermedia', type: 'N' },
     { code: 'FAPH', name: 'Photography', type: 'C' },
     { code: 'FAPT', name: 'Painting', type: 'N' },
     { code: 'FAPR', name: 'Printmaking', type: 'N' },
     { code: 'FASC', name: 'Sculpture', type: 'N' },
     { code: 'PAS', name: 'Public Art Studies', type: 'N' } ] }
```
*IMPORTANT: dept_raw repeats for EACH school, asynchronously*

### school
Based on the value parameters, the callback will recieve different types of data:

* ```{term: "####"}``` *current term is default*
* ```TROJAN.school((school)=>{/* */})``` *Alias of <b>dept_raw</b>.* 
* ```TROJAN.school((school)=>{/* */},{school: "AAAA"})``` *Filtered by school (returns 1 object)*
* ```TROJAN.school((code)=>{/* */},{justcode: true})``` *code = string of each school code, asynchronous for each, e.g. "FINE"*

### dept
Based on the value parameters, the callback will recieve different types of data:

* ```{term: "####"}``` *current term is default*
* ```TROJAN.dept((dept)=>{/* */})``` *Returns object ```{ code: 'ARTL', name: 'Arts Leadership', type: 'N' }```, asynchronous for each dept*
* ```TROJAN.dept((dept)=>{/* */}, {school: "AAAA"})``` *Filtered by school, asynchronous for each dept*
* ```TROJAN.dept((code)=>{/* */}, {justcode: true})``` *code = string of each department code, asynchronous for each, e.g. "CSCI"*

### dept_info
The callback will recieve the object of each department's information, asyncronously for each department.

* ```{term: "####"}``` *current term is default*
* ```{dept: "AAAA"}``` *filters to show object of one department*

### course_raw
This function sends different types of data depending on value parameter, but will **NOT** work without either the dept or justcode parameters. Please include either, or both.

* ```{term: "####"}``` *current term is default*
* ```{dept: "AAAA"}``` *object of course data, example below.*
* ```{justcode: true}``` *only the string for course ID, e.g. "CSCI-140", will be sent. It will repeat for all courses for all departments if a dept is not provided.

**Course data object example**
```javascript
{ IsCrossListed: 'N',
  PublishedCourseID: 'CSCI-794D',
  ScheduledCourseID: 'CSCI-794D',
  CourseData: 
   { prefix: 'CSCI',
     number: '794',
     sequence: 'D',
     suffix: {},
     title: 'Doctoral Dissertation',
     description: 'Credit on acceptance of Dissertation. Graded CR/NC.',
     units: '2.0',
     restriction_by_major: {},
     restriction_by_class: ' Registration open to the following class level(s): Doctoral Student',
     restriction_by_school: {},
     CourseNotes: {},
     CourseTermNotes: {},
     prereq_text: 'CSCI-794c',
     coreq_text: {},
     SectionData: { ... } } }
 ```

### course
Will send to callback one object of the data of the selected course.

* ```{term: "####"}``` *current term is default*
* ```{course: "AAAA-###"}``` *(<b>REQUIRED</b>) works even if there is a letter sequence attached to the end, e.g. "CSCI-140L"*

### sect
Will send to callback different types of data, provided that a course is selected.

* ```{term: "####"}``` *current term is default*
* ```{course: "AAAA-###"}``` *(<b>REQUIRED</b>) sends the object of each section's information within the course*
* ```{sect: "#####"}``` *Filters the sections to one object*
* ```{justcode: true}``` *Returns only the string of the ID of each section, although only useful when {sect} has no value.*
