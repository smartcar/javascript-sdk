window.Smartcar = (function(window) {
  'use strict';

  const Smartcar = {};

  Smartcar.oemConfig = {
    acura: {color: '#020202'},
    audi: {color: '#000000'},
    bmw: {color: '#2E9BDA'},
    'bmw-connected': {color: '#2E9BDA'},
    buick: {color: '#333333'},
    cadillac: {color: '#941711'},
    chevrolet: {color: '#042F6B'},
    chrysler: {color: '#231F20'},
    dodge: {color: '#000000'},
    ford: {color: '#003399'},
    fiat: {color: '#B50536'},
    gmc: {color: '#CC0033'},
    honda: {color: '#DA251D'},
    hyundai: {color: '#00287A'},
    genesis: {color: '#000000'},
    infiniti: {color: '#1F1F1F'},
    jeep: {color: '#374B00'},
    kia: {color: '#C4172C'},
    landrover: {color: '#005A2B'},
    lexus: {color: '#5B7F95'},
    nissan: {color: '#C71444'},
    nissanev: {color: '#C71444'},
    ram: {color: '#000000'},
    tesla: {color: '#CC0000'},
    volkswagen: {color: '#000000'},
    volvo: {color: '#000F60'},
    mercedes: {color: '#222222'},
  };

  // Sets default popup window size
  const windowSettings = {
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
    this.popup = !options.disablePopup;
    this.approvalPrompt = options.forcePrompt ? 'force' : 'auto';
    this.callback = options.callback || function() { /* empty */ };

    if (options.development === true) {
      this.oemConfig.mock = {color: '#495F5D'};
    }
  };

  /**
   * Generates an object with OAuth URL given a single OEM name
   *
   * @param  {String} oemName tesla|ford|bmw|lexus|volvo|mock
   * @return {String} generated authorize link
   */
  Smartcar.generateLink = function(oemName) {
    let link = '';
    link += `https://${oemName}.smartcar.com/oauth/authorize`;
    link += `?response_type=${this.grantType}`;
    link += `&client_id=${this.clientId}`;
    link += `&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    link += `&scope=${encodeURIComponent(this.scope.join(' '))}`;
    link += `&approval_prompt=${this.approvalPrompt}`;

    if (this.state) {
      link += `&state=${this.state}`;
    }

    return link;
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
    const links = {};
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
    const container = document.getElementById(selector);
    oems = oems || Object.keys(Smartcar.oemConfig);

    const links = this.generateLinks(oems);

    let html = '';
    oems.forEach((oemName) => {

      const id = `id="${oemName}-button"`;
      const cls = 'class="button connect-button"';
      const style = `style="
        color: #FBFBFB;
        text-decoration: none;
        padding: 7px 14px;
        margin: 7px;
        text-align: center;
        font-weight: bold;
        font-family: Lato,Arial,Helvetica,sans-serif;
        border-radius: 5px;
        text-transform: uppercase;
        max-width: 500px;
        border: 0;
        display: block;
        font-size: 15px;
        background-color: ${Smartcar.oemConfig[oemName].color}"`;

      let link;
      if (this.popup) {
        link = `href="#" onclick="Smartcar.openDialog('${oemName}');"`;
      } else {
        link = `href="${links[oemName]}"`;
      }

      html += `<a ${id} ${cls} ${style} ${link}>Connect with ${oemName}</a>`;

    });

    container.innerHTML = html;
  };

  /**
   * Calculate the popup window size and position based on the current window
   * settings.
   *
   * @return {String} a string of window settings
   */
  Smartcar._getWindowOptions = function() {
    const width = (window.outerWidth - windowSettings.width) / 2;
    const height = (window.outerHeight - windowSettings.height) / 8;

    let options = '';
    options += `top=${window.screenY + height},`;
    options += `left=${window.screenX + width},`;
    options += `width=${windowSettings.width},`;
    options += `height=${windowSettings.height},`;
    return options;
  };

  /**
   * Opens a dialog for a specific OEM
   *
   * @param {String} oemName oem name
   */
  Smartcar.openDialog = function(oemName) {
    const href = this.generateLink(oemName);
    const windowOptions = Smartcar._getWindowOptions();
    window.open(href, `Login with ${oemName}`, windowOptions);
    return false; // this is equivalent to calling event.preventDefault();
  };

  return Smartcar;
})(window);
