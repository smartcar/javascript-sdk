// Smartcar SDK

var SDK = (function(window, undefined) {
  var SDK = {};

  var oemConfig = {
    tesla: {  color: '#CC0000' },
    ford: {   color: '#2E9BDA' },
    bmw: {    color: '#003399' },
    lexus: {  color: '#5B7F95' },
    volvo: {  color: '#000F60' }
  };

  SDK.init = function(options) {
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.oems = options.oems || Object.keys(oemConfig);
    this.buttons();
  };

  SDK.generateLinks = function() {
    var self = this;
    return this.oems.map(function(oemName) {
      var oem = oemConfig[oemName];
      oem.name = oemName;
      oem.link = 'https://' + oemName
        + '.smartcar.com/oauth/authorize?'
        + 'response_type=token'
        + '&client_id=' + self.clientId
        + '&redirect_uri=' + encodeURIComponent(self.redirectUri)
        + '&scope=' + encodeURIComponent(self.scope.join(' '))
        + '&approval_prompt=auto';
      return oem;
    });
  };

  SDK.buttons = function() {
    var self = this, html = '';

    var append = document.getElementById('smartcar-buttons');

    this.oems = this.generateLinks();
    this.oems.forEach(function(oem) {
      html += '<a id="'
        + oem.name + 'Button" href="'
        + oem.link
        + '" class="button connect-button" style="background-color:'
        + oem.color + '">Connect with '
        + oem.name + '</a>';
    });

    append.innerHTML = html;

    this.oems.forEach(function(oem) {
      document.getElementById(oem.name + 'Button').addEventListener('click', function(event) {
        event.preventDefault();
        var wnd_settings = {
          width: 430,
          height: 500,
        };
        wnd_settings.left = window.screenX + (window.outerWidth - wnd_settings.width) / 2;
        wnd_settings.top = window.screenY + (window.outerHeight - wnd_settings.height) / 8;
        var wnd_options = 'width=' + wnd_settings.width + ',height=' + wnd_settings.height;
        wnd_options += ',toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0';
        wnd_options += ',left=' + wnd_settings.left + ',top=' + wnd_settings.top;

        window.open(this.href, 'Login with ' + oem.name, wnd_options);
      });
    });

  };

  SDK.callback = function() {};

  return SDK;
})(window);
