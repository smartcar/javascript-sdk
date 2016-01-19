/* jshint browser:true */

// Smartcar JS SDK

var Smartcar = (function(window, undefined) {
  'use strict';
  var Smartcar = {};

  // OEM static configuration
  Smartcar.oemConfig = {
    tesla: {  color: '#CC0000' },
    ford: {   color: '#003399' },
    bmw: {    color: '#2E9BDA' },
    lexus: {  color: '#5B7F95' },
    volvo: {  color: '#000F60' }
  };

  // Sets default popup window size
  var wnd_settings = {
    width: 430,
    height: 500,
  };

  wnd_settings.left = window.screenX + (window.outerWidth - wnd_settings.width) / 2;
  wnd_settings.top = window.screenY + (window.outerHeight - wnd_settings.height) / 8;

  var wnd_options = 'width=' + wnd_settings.width + ',height=' + wnd_settings.height;
  wnd_options += ',toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0';
  wnd_options += ',left=' + wnd_settings.left + ',top=' + wnd_settings.top;

  /**
   * Initializes Smartcar Object
   *
   * @param  {String} options the sdk configuration object
   * @param  {String} options.clientId app client ID
   * @param  {String} options.redirectUri app redirect URI
   * @param  {String} options.selector id of buttons container div
   * @param  {String} options.scope app oauth scope
   * @param  {String} options.grantType oauth grant type -> defaults to 'code'
   * @param  {Boolean} options.disablePopup disables popups
   * @param  {Array} options.oems oems to generate buttons for
   * @param  {Boolean} options.forcePrompt forces permission screen if true
   * @param  {Function} options.callback required function for if popup isn't disabled
   */
  Smartcar.init = function(options) {
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.selector = options.selector;
    this.grantType = options.grantType || 'code';
    this.popup = options.disablePopup ? false : true;
    this.oems = options.oems || Object.keys(Smartcar.oemConfig);
    this.approvalPrompt = options.forcePrompt ? 'force' : 'auto';
    this.callback = options.callback || function() {};
  };

  /**
   * Generates an object with OAuth URL given a single OEM name
   *
   * @param  {String} oemName tesla|ford|bmw|lexus|volvo
   * @return {Object} oem object with link property
   */
  Smartcar.generateLink = function(oemName) {
    var oem = Smartcar.oemConfig[oemName];
    oem.name = oemName;
    oem.link = 'https://' + oemName
      + '.smartcar.com/oauth/authorize?'
      + 'response_type=' + this.grantType
      + '&client_id=' + this.clientId
      + '&redirect_uri=' + encodeURIComponent(this.redirectUri)
      + '&scope=' + encodeURIComponent(this.scope.join(' '))
      + '&approval_prompt=' + this.approvalPrompt;
    return oem;
  };

  /**
   * Returns mapped out oem object with links
   *
   * @param  {Object} oems
   * @return {Array} array of oem objects
   */
  Smartcar.generateLinks = function(oems) {
    return oems.map(function(oemName) {
      return Smartcar.generateLink(oemName);
    });
  };

  /**
   * Create buttons and insert into DOM
   *
   * @param {Function} done optional callback
   */
  Smartcar.generateButtons = function(done) {
    var html = '';
    var append = document.getElementById(this.selector);

    var oems = this.generateLinks(this.oems);

    oems.forEach(function(oem) {
      html += '<a id="'
        + oem.name + '-button" href="' + oem.link
        + '" class="button connect-button" style="color: #FBFBFB;'
        + 'border:0;display:block;font-size:15px;background-color:'
        + oem.color
        + '">Connect with ' + oem.name + '</a>';
    });

    append.innerHTML = html;

    // Register popup events if enabled
    if(this.popup) {
      Smartcar.registerPopups(oems);
    }

    if(done) {
      done();
    }
  };

  /**
   * Registers popup click handlers for given OEM objects
   *
   * @param  {Array} oems oem array
   */
  Smartcar.registerPopups = function(oems) {
    oems.forEach(function(oem) {
      document.getElementById(oem.name + '-button').addEventListener('click', function(event) {
        event.preventDefault();
        Smartcar.openDialog(oem.name);
      });
    });
  };

  /**
   * Opens a dialog for a specific OEM
   *
   * @param  {String} oemName oem name
   */
  Smartcar.openDialog = function(oemName) {
    var href = this.generateLink(oemName).link;
    window.open(href, 'Login with ' + oemName, wnd_options);
  };

  return Smartcar;
})(window);
