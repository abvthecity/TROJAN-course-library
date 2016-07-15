var ajax = require('reqwest');
var Promise = require('promise');

module.exports = function (url) {
  return new Promise(function (resolve, reject) {
    ajax({
      url: 'http://web-app.usc.edu/web/soc/api' + url,
      method: 'get',
      error: reject,
      success: function (res) {
        var data = JSON.parse(res);
        resolve(data);
      },
    });
  });
};
