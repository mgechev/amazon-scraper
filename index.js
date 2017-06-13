// phantomjs --ignore-ssl-errors=yes --web-security=false index.js

phantom.onError = function (msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

console.log('Scraping started');
var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
  console.log(msg);
};


// var xhr = require('./xhr');
var Categories = require('./config').Categories;

var currentCategory = 0;

var processNextCategory = function () {
  if (currentCategory >= Categories.length) {
    console.log('No more categories. Finishing.')
    phantom.exit();
    return;
  } else {
    var url = Categories[currentCategory];
    console.log('Processing URL:', url);
    page.onCallback = function () {
      console.log('Trying new category.');
      currentCategory += 1;
      processNextCategory();
    };
    page.open(url);

    var lastUrl = null;

    page.onLoadFinished = function() {
      if (lastUrl !== page.url) {
        lastUrl = page.url;
        page.evaluate(function () {
          var categoryUrl = sessionStorage.getItem('categoryUrl');
          if (categoryUrl !== window.location.href &&
              categoryUrl) {
            console.log('Subcategory!', window.location.href);
            console.log('Navigating back to', categoryUrl);
            window.location.href = categoryUrl;
          } else {
            var subCategories = [];
            if (sessionStorage.getItem('toTraverse')) {
              subCategories = JSON.parse(sessionStorage.getItem('toTraverse'));
            } else {
              var lis = document.querySelectorAll('#leftNav .categoryRefinementsSection li a');
              sessionStorage.setItem('categoryUrl', window.location.href);
              // Ignore the first link, it's back to the main category
              for (var i = lis.length - 2; i < lis.length; i += 1) {
                subCategories.push(lis[i].href);
              }
            }

            if (!subCategories.length) {
              console.log('Category finished!');
              sessionStorage.clear();
              if (window.callPhantom) {
                window.callPhantom();
              }
            } else {
              console.log('All remaining subcategories:\n', '\t' + subCategories.join('\n\t'));
              var newUrl = subCategories.shift();
              // console.log('Processing URL:', newUrl);
              sessionStorage.setItem('toTraverse', JSON.stringify(subCategories));
              console.log('Navigating to', newUrl);
              window.location.href = newUrl;
            }
          }
        });
      }
    };
  }
};

processNextCategory();
