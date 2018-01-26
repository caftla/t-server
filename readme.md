### Server Setup
Install the project dependencies
```npm install```

Setup project configurations ```npm run init```

### Run The Server
```npm run dev```

### Previewing The Page

To preview the page, just open your index.html file in the browser

### Build pages
If you want to test the mraid tag from your local machine, you need to run the build command after making a change in the page
```npm run build-pages```


### Previewing MRAID Tag

Tag example:
```
<script src="mraid.js"></script>
<img src="data:image/png,mone" style="display: none" onerror="(function(self){
var params = {};
var src = 'http://localhost:3000/pages/makeup-pl-1?landingpage=http%3A%2F%2Fexample.com&country=PL&adscenario=pl_yes_v8_wap_s_sam&affiliateid=SAM&clickid=1';for (var k in params) { src += '&amp;' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }var scriptTag = document.createElement('script');scriptTag.id='mobirun-script';scriptTag.src=src;document.head.appendChild(scriptTag);})(this);" />
```

Replace the page name ```makeup-pl-1``` in the tag with your page name

Use the following platform to test the tag in the browser
http://widget.mixpo.com/script/mraid/

To test in the mobile device, use the "MRAID Ads SDK Tester" from app store.

1. change the hostname in the tag

2. replace ```localhost:3000``` with your local ip

### Automatically opening composer

In global scope

```
loadScriptWithQueryString('https://ipapi.co/jsonp/', toQueryString({callback: 'page_setip'}));

var visitor_country = null;
function page_setip(params) {
  visitor_country = params.country;
}
```

Inside doit()

```
setTimeout(function() {
  if(!!visitor_country && visitor_country == 'PL' && Math.random() > 0.6) {

      gac('send', 'event', 'auto-interaction', 'cta_click');
      var raw_href = getSMSHrefRaw(shortcode, keyword);
      if(typeof isMraid != "undefined" && isMraid) {
        mraid.open(raw_href);
      } else {
        window.location.href = raw_href;
      }
    }
}, 2000);
```
----

Tag example

```
<script src="mraid.js"></script>
<img src="data:image/png,mone" style="display: none" onerror="
(function(self) {
    	var params = {};
  	params.offer = 1161; // change
    	params.click_id = '{CLICK_URL}'; // change
    	params.aff_sub6 = 'Matomy'; // change
    	params.campaignid = 1161; // change
    	params.source = 'Smadex'; // change
    	params.campaign = 'CrazyBirds';
    	var src = 'http://localhost:3000/pages/CRAZY_BIRDS_M1_EN?device=smart';
    	for (var k in params) {
        	src += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    	};
    	var scriptTag = document.createElement('script');
    	scriptTag.id = 'mobirun-script';
    	scriptTag.src = src;
	document.head.appendChild(scriptTag);
})(this);
"
/>
```