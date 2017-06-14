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
        page.injectJs('jquery.js');
        page.injectJs('parser.js');
        page.evaluate(function () {
          var categoryUrl = sessionStorage.getItem('categoryUrl');
          if (categoryUrl !== window.location.href &&
              categoryUrl) {
            handleSubcategory();
          } else {
            handleCategory();
          }

          function handleSubcategory() {
            console.log('Subcategory!', window.location.href);
            console.log('Navigating back to', categoryUrl);
            var links = document.querySelectorAll('.s-result-item.celwidget div.a-section.a-inline-block > a');
            var totalReady = 0;

            for (var i = 0; i < links.length; i += 1) {
              (function (href, links) {
                var XMLRequest = $.ajax({
                  type: "GET",
                  url: href,
                  success: function(data, textStatus) {
                    console.log('Processing product');
                    var myHTML = insertDocument(data);
                    var parser = new Parser(myHTML);
                    console.log(JSON.stringify(parser.getRankAndCategory('Best Sellers Rank')));
                    totalReady += 1;
                    if (totalReady >= links.length) {
                      window.location.href = categoryUrl;
                    }
                  },
                  error: function(jqXHR, textStatus, errorThrown){
                    console.error('Error', errorThrown);
                  }
                });
              }(links[i].href, links));
            }

          }

          function handleCategory() {
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

          function insertDocument (myHTML) {
            var newHTMLDocument = document.implementation.createHTMLDocument().body;
            newHTMLDocument.innerHTML = myHTML;
            [].forEach.call(newHTMLDocument.querySelectorAll("script, style, img:not(#landingImage):not(#imgBlkFront):not(#main-image)"), function(el) {el.remove(); });
            return $(newHTMLDocument.innerHTML);
          }

        });
      }
    };
  }
};

processNextCategory();
