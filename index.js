// phantomjs --ignore-ssl-errors=yes --web-security=false req.js

console.log('Loading a web page');
var page = require('webpage').create();
const xhr = require('./xhr');
var url = 'https://www.amazon.com/Audio-Video-Accessories-Supplies/b/ref=dp_bc_3?ie=UTF8&node=172532';
page.open(url, function (status) {
  xhr();
});


// var request = require('request');

// var options = {
//   url: 'https://junglescoutpro.herokuapp.com/api/v1/est_sales?store=us&rank=14&category=Office%20Products&dailyToken=qzREtlDWWb3V9Sf/0UluOA==',
//   headers: {
//     'Host': 'www.amazon.com',
//     'User-Agent': ' Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
//   }
// };

// function callback(error, response, body) {
//   if (!error && response.statusCode == 200) {
//     var info = JSON.parse(body);
//     console.log(info);
//   } else {
//     console.log(error);
//   }
// }

// request(options, callback);
