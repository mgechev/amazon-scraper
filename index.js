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
page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

page.onConsoleMessage = function(msg) {
  console.log(msg);
};


// var xhr = require('./xhr');
var Categories = require('./config').Categories;
var DailyToken = require('./config').DailyToken;

var currentCategory = 0;

var processNextCategory = function () {
  if (currentCategory >= Categories.length) {
    console.log('No more categories. Finishing.')
    phantom.exit();
    return;
  } else {
    var url = Categories[currentCategory];
    console.log('Processing URL:', url);
    page.onCallback = function (data) {
      console.log('Trying new category.');
      require('fs').write('result.json', data, 'a\+');
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
            initCategory();
            handleCategory();
          }

          function handleSubcategory() {
            console.log('Subcategory!', window.location.href);
            var links = document.querySelectorAll('.s-result-item.celwidget div.a-section.a-inline-block > a');
            console.log('Processing top ' + links.length + ' products');
            var totalReady = 0;

            var title = document.querySelector('#merchandised-content > div.unified_widget.pageBanner > h1 > b').innerText;
            var products = [];

            for (var i = 0; i < links.length; i += 1) {
              (function (href, links) {
                var XMLRequest = $.ajax({
                  type: "GET",
                  url: href,
                  success: function(data, textStatus) {
                    console.log('Processing product');
                    var myHTML = insertDocument(data);
                    var parser = new Parser(myHTML);
                    var productTitle = parser.getProductTitle();
                    var productImage = parser.getProductImage();
                    var productPrice = parser.getPrice();
                    var productBrand = parser.getBrand();
                    var rating = parser.getRating();
                    var data = parser.getRankAndCategory('Best Sellers Rank');
                    var productUrl = 'https://junglescoutpro.herokuapp.com/api/v1/est_sales?store=us&rank='
                        + data.rank + '&category=' + encodeURIComponent(data.category) + '&dailyToken=' + 'k81Cwu5e/i5aMjNFleHHsw==';
                    console.log(productUrl);
                    $.ajax({
                      type: 'GET',
                      url: productUrl,
                      success: function(data, textStatus) {
                        products.push({
                          title: productTitle,
                          image: productImage,
                          price: productPrice,
                          brand: productBrand,
                          rating: rating,
                          sales: data.estSalesResult
                        });
                        totalReady += 1;
                        if (totalReady >= links.length) {
                          console.log('Completed all ' + totalReady + ' products.');
                          var category = JSON.parse(localStorage.getItem('currentCategory'));
                          category.subCategories.push({
                            title: title,
                            url: location.href,
                            products: products
                          });
                          localStorage.setItem('currentCategory', JSON.stringify(category));
                          window.location.href = categoryUrl;
                        }
                      }
                    });
                  },
                  error: function(jqXHR, textStatus, errorThrown){
                    console.error('Error', errorThrown);
                  }
                });
              }(links[i].href, links));
            }

          }

          function initCategory() {
            var title = document.querySelector('#merchandised-content > div.celwidget.bxw-pageheader.is-desktop > div.bxw-pageheader__title > div > h1').innerText;
            var url = window.location.href;
            localStorage.removeItem('currentCategory');
            localStorage.setItem('currentCategory', JSON.stringify({
              title: title,
              url: url,
              subCategories: []
            }));
          }

          function handleCategory() {
            var subCategories = [];
            if (sessionStorage.getItem('toTraverse')) {
              subCategories = JSON.parse(sessionStorage.getItem('toTraverse'));
            } else {
              var links = document.querySelectorAll('#leftNav > ul:nth-child(2) > ul > div > li a');
              sessionStorage.setItem('categoryUrl', window.location.href);
              // Ignore the first link, it's back to the main category
              for (var i = links.length - 2; i < links.length; i += 1) {
                subCategories.push(links[i].href);
              }
            }

            if (!subCategories.length) {
              console.log('Category finished!');
              sessionStorage.clear();
              if (window.callPhantom) {
                window.callPhantom(localStorage.getItem('currentCategory'));
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
