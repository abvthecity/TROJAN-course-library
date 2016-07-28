var ajax = require('reqwest');
var Promise = require('promise');

module.exports = function (url) {
  return new Promise(function (resolve, reject) {
    buffer();
    function buffer() {
      ajax({
        url: 'http://web-app.usc.edu/web/soc/api' + url,
        method: 'get',
        error: reject,
        success: function (res) {
          var data = JSON.parse(res);
          resolve(data);
        },

        error: function (err) {
          console.error('ajax err:', err._url.href);
          setTimeout(buffer, 200);
        },
      });
    }
  });
};
