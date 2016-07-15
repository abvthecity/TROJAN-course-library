var TROJAN = require('./TROJAN');

TROJAN.deptsY().then(function (res) {
  console.log(res);

  // for (var key in res.courses) {
  //   for (var sid in res.courses[key].sections) {
  //     console.log(res.courses[key].sections[sid].day);
  //   }
  // }
});
