  function createXMLHttp() {
    //If XMLHttpRequest is available then using it
    if (typeof XMLHttpRequest !== undefined) {
      return new XMLHttpRequest;
    //if window.ActiveXObject is available than the user is using IE...so we have to create the newest version XMLHttp object
    } else if (window.ActiveXObject) {
      var ieXMLHttpVersions = ['MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'],
          xmlHttp;
      //In this array we are starting from the first element (newest version) and trying to create it. If there is an
      //exception thrown we are handling it (and doing nothing ^^)
      for (var i = 0; i < ieXMLHttpVersions.length; i++) {
        try {
          xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
          return xmlHttp;
        } catch (e) {
        }
      }
    }
  }

  function getData(url, success, error) {
    var xmlHttp = createXMLHttp();
    xmlHttp.open('get', url, true);
    xmlHttp.setRequestHeader('Host', 'junglescoutpro.herokuapp.com');
    xmlHttp.setRequestHeader('Origin', 'chrome-extension://lfgpfhoadcpndoogjiogflmgegfbekec');
    xmlHttp.setRequestHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
    xmlHttp.setRequestHeader('Referer', 'https://www.amazon.com/Audio-Video-Accessories-Supplies/b/ref=dp_bc_3?ie=UTF8&node=172532');
    xmlHttp.setRequestHeader('Accept-Encoding', 'gzip, deflate, sdch, br');
    xmlHttp.setRequestHeader('Accept-Language', 'bg,en-US;q=0.8,en;q=0.6');
    xmlHttp.send(null);
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState === 4) {
        if (xmlHttp.status === 200) {
          success.call(null, xmlHttp.responseText);
        } else {
          error.call(null, xmlHttp.responseText);
        }
      } else {
        //still processing
      }
    };
  }

  console.log('Done!');

module.exports = function () {
  try {
    getData('https://junglescoutpro.herokuapp.com/api/v1/est_sales?store=us&rank=14&category=Office%20Products&dailyToken=Pl5ZDc213JypcDpCcWpFWw==', function (a) {
      console.log(a);
      phantom.exit();
    }, function (e) {
      console.error(e);
      phantom.exit();
    });
  } catch (e) {
    console.error(e);
    phantom.exit();
  }
};
