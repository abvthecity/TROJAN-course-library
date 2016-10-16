// How to use TROJAN.depts() and related functions

var TROJAN = require('../src/TROJAN');
var _ = require('lodash');

// expect: nested object of departments
TROJAN.depts().then(function (deptsData) {
  console.log(deptsData);

  // expect: flattened object of departments
  TROJAN.depts_flat(deptsData).then(function (deptsFlatData) {
    console.log(deptsFlatData);

    // expect: Y-type depts (high-level schools, no courses)
    TROJAN.deptsY(deptsFlatData).then(console.log);

    // expect: C-type depts (depts that offer GE courses)
    TROJAN.deptsC(deptsFlatData).then(console.log);

    // expect: N-type depts (depts that offer courses)
    TROJAN.deptsN(deptsFlatData).then(console.log);

    // expect: C- and N-type depts
    TROJAN.deptsCN(deptsFlatData).then(function (deptsWithCourses) {
      // console.log(deptsWithCourses);

      // expect: full object of all department data
      TROJAN.deptBatch(Object.keys(deptsWithCourses)).then(function (dept) {
        console.log(dept);
      });
    });
  });
});
