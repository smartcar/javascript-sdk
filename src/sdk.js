/* jshint browser:true */
/* exported Smartcar */
/* globals jQuery */

// Smartcar JS SDK

var Smartcar = (function(window, undefined) {
  'use strict';
  var Smartcar = {};

  // OEM static configuration
  Smartcar.oemConfig = {
    acura:      { color: '#020202' },
    bmw:        { color: '#2E9BDA' },
    buick:      { color: '#333333' },
    cadillac:   { color: '#941711' },
    chevrolet:  { color: '#042F6B' },
    chrysler:   { color: '#231F20' },
    dodge:      { color: '#000000' },
    ford:       { color: '#003399' },
    fiat:       { color: '#B50536' },
    gmc:        { color: '#CC0033' },
    infiniti:   { color: '#1F1F1F' },
    jeep:       { color: '#374B00' },
    lexus:      { color: '#5B7F95' },
    nissan:     { color: '#C71444' },
    ram:        { color: '#000000' },
    tesla:      { color: '#CC0000' },
    volkswagen: { color: '#000000' },
    volvo:      { color: '#000F60' },
  };

  // Sets default popup window size
  var wnd_settings = {
    width: 430,
    height: 500,
  };

  /**
   * Initializes Smartcar Object
   *
   * @param {String} options the sdk configuration object
   * @param {String} options.clientId app client ID
   * @param {String} options.redirectUri app redirect URI
   * @param {String[]} options.scope app oauth scope
   * @param {String} [options.state] oauth state
   * @param {String} [options.grantType=code] oauth grant type can be either
   * `code` or `token`. Defaults to `code`.
   * @param {Boolean} [options.disablePopup=false] disables popups
   * @param {Boolean} [options.forcePrompt=false] forces permission screen if
   * set to true
   * @param {Function} [options.callback] called when oauth popup window
   * completes flow. the parameter is not used when popup is disabled.
   * @param {Boolean} [options.development] appends mock oem if true
   */
  Smartcar.init = function(options) {
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.state = options.state || null;
    this.grantType = options.grantType || 'code';
    this.popup = options.disablePopup ? false : true;
    this.approvalPrompt = options.forcePrompt ? 'force' : 'auto';
    this.callback = options.callback || function() {};

    if (options.development === true) {
      this.oemConfig.mock = { color: '#495F5D' };
    }
  };

  /**
   * Generates an object with OAuth URL given a single OEM name
   *
   * @param  {String} oemName tesla|ford|bmw|lexus|volvo|mock
   * @return {String} generated authorize link
   */
  Smartcar.generateLink = function(oemName) {
    var stateString = '';

    if (this.state) {
      stateString = '&state=' + this.state;
    }

    return 'https://' + oemName +
      '.smartcar.com/oauth/authorize?' +
      'response_type=' + this.grantType +
      '&client_id=' + this.clientId +
      '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
      '&scope=' + encodeURIComponent(this.scope.join(' ')) +
      '&approval_prompt=' + this.approvalPrompt +
      stateString;
  };

  /**
   * Returns mapped out oem object with links
   *
   * @param  {Object} [oems] oems to generate links for, defaults to all OEMs
   * @return {Object} map of oemName to link:
   *   { tesla: 'https://tesla.smartcar.com/oauth/authorize?... }
   */
  Smartcar.generateLinks = function(oems) {
    oems = oems || Object.keys(Smartcar.oemConfig);
    var links = {};
    oems.forEach(function(oemName) {
      links[oemName] = Smartcar.generateLink(oemName);
    });
    return links;
  };

  /**
   * Create buttons and insert into DOM
   *
   * @param {String} selector id of buttons container div
   * @param {String[]} [oems] oems to generate buttons for, defaults to
   * all OEMs
   */
  Smartcar.generateButtons = function(selector, oems) {
    var container = document.getElementById(selector);
    oems = oems || Object.keys(Smartcar.oemConfig);

    var links = this.generateLinks(oems);

    var html = '';
    var self = this;
    oems.forEach(function(oemName) {
      var link;

      if (self.popup) {
        link = '#';
      } else {
        link = links[oemName];
      }

      html += '<a id="' +
        oemName + '-button" href="' + link +
        '" class="button connect-button" style="color: #FBFBFB;' +
        'text-decoration:none;padding:7px 14px;margin:7px;text-align:center;' +
        'font-weight:bold;font-family:Lato,Arial,Helvetica,sans-serif;' +
        'border-radius:5px;text-transform:uppercase;max-width:500px;' +
        'border:0;display:block;font-size:15px;background-color:' +
        Smartcar.oemConfig[oemName].color +
        '">Connect with ' + oemName + '</a>';
    });

    container.innerHTML = html;

    // Register popup events if enabled
    if (this.popup) {
      Smartcar._registerPopups(oems);
    }
  };

  /**
   * Registers popup click handlers for given OEM objects
   *
   * @param {String[]} oems array of oem names
   */
  Smartcar._registerPopups = function(oems) {
    oems.forEach(function(oem) {

      if (window.jQuery) {
        jQuery(document).on('click', '#' + oem + '-button', function(event) {
          event.preventDefault();
          Smartcar.openDialog(oem);
        });
      } else {
        var button = document.getElementById(oem + '-button');
        button.addEventListener('click', function(event) {
          event.preventDefault();
          Smartcar.openDialog(oem);
        });
      }

    });
  };

  /**
   * Calculate the popup window size and position based on the current window
   * settings.
   *
   * @return {String} a string of window settings
   */
  Smartcar._getWindowOptions = function() {
    wnd_settings.left = window.screenX +
      (window.outerWidth - wnd_settings.width) / 2;
    wnd_settings.top = window.screenY +
      (window.outerHeight - wnd_settings.height) / 8;

    var wnd_options = 'width=' + wnd_settings.width +
      ',height=' + wnd_settings.height;
    wnd_options += ',toolbar=0,scrollbars=1,status=1' +
      ',resizable=1,location=1,menuBar=0';
    wnd_options += ',left=' + wnd_settings.left + ',top=' + wnd_settings.top;

    return wnd_options;
  };

  /**
   * Opens a dialog for a specific OEM
   *
   * @param {String} oemName oem name
   */
  Smartcar.openDialog = function(oemName) {
    var href = this.generateLink(oemName);
    var wnd_options = Smartcar._getWindowOptions();
    window.open(href, 'Login with ' + oemName, wnd_options);
  };

  return Smartcar;
})(window);
