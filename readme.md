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
<img src="data:image/png,mone" style="display: none" onerror="(function(self){var params = {};
params.pubid = '541793';
params.clickid = '2a8201e4530397771a9517b686916fbf';
params.ctrTrackingUrl = 'http://geo-tracker.smadex.com/hyperad/click/en?q=464801ee1a64ecc3118b6b29dc117cbf8dbfbba66517f1a170b96f653a9bb60d8fd50a0cadeb22306e072fe6822b17a71b4310fadf114ccbd8a3af4f7903ca214d9ba2f59f24d19abbf4a701237afe9111d1988a54835441151a2c814b62e9e45a3746f6f5cca1803b6ddcfce04953e24151b5451bf4b80a7879e8a860b2424c84d2e66cc0a66b4c64cdd75e8e07bddc11568e017e7fac056c60225266daddd4a27bc9c05134aa59907725922968a8b4b705be2f1ba93c2112588f35f2dc477bba43690fbe45b2eda603da3baa17db32dd1e9f09c350c6f484982f5941cbac53240b5909de9c313f015b03715ffeb2de69cba65bfead4e5aaaa4c61fdfa356b50c89111ff6239efe843afbc76f8fe46993d0dcf56c08de3d5c66af531bf937c5c7e73c7b8fd87aea1d6c5e64ce996b33561907f2438e263cae262a56855965fbce3cb8141473663c115733afa1f76d697c9d814ad1568343ff1b93a477848d536e371d3c156a8cf321ed151550636ef8c22f3c1cc06213459b2260900840ff3d';
var src = 'http://localhost:3000/pages/makeup-pl-1?landingpage=http%3A%2F%2Fexample.com&country=PL&adscenario=pl_yes_v8_wap_s_sam&affiliateid=SAM';for (var k in params) { src += '&amp;' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }var scriptTag = document.createElement('script');scriptTag.id='mobirun-script';scriptTag.src=src;document.head.appendChild(scriptTag);})(this);" />
```

Replace the page name ```makeup-pl-1``` in the tag with your page name

Use the following platform to test the tag in the browser
http://widget.mixpo.com/script/mraid/

To test in the mobile device, use the "MRAID Ads SDK Tester" from app store.

1. change the hostname in the tag

2. replace ```localhost:3000``` with your local ip
