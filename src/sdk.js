// Smartcar SDK

function SDK(clientId, redirectUri, scope) {
  this.clientId = clientId;
  this.redirectUri = redirectUri;
  this.scope = scope;
  this.oems = ['tesla', 'ford', 'bmw', 'volvo', 'lexus'];
}

SDK.prototype.links = function() {
  var links = [], self = this;
  this.oems.forEach(function(oem) {
    var url = 'https://' + oem
      + '.smartcar.com/oauth/authorize?'
      + 'response_type=token&'
      + '&client_id=' + self.clientId
      + '&' + encodeURIComponent(self.redirectUri)
      + '&' + encodeURIComponent(self.scope)
      + '&approval_prompt=auto';
    return links.push(url);
  });
  return links;
};

SDK.prototype.popup = function() {};

SDK.prototype.callback = function() {};
