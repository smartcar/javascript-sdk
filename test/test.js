/* global Smartcar, sinon, expect */
/* eslint-disable object-shorthand */

'use strict';

suite('Smartcar Auth SDK', function() {

  var sandbox;

  var clientId = 'ab3f8354-49ed-4670-8f53-e8300d65b387';
  var redirectUri = 'http://localhost:5000/callback';
  var scope = ['read_vehicle_info', 'read_odometer'];
  var grantType = 'token';
  var selector = 'smartcar-buttons';
  var state = '3jdk23iojsdfkjfsd';

  setup(function() {
    sandbox = sinon.sandbox.create();
    Smartcar.init({
      clientId: clientId,
      redirectUri: redirectUri,
      scope: scope,
      grantType: grantType,
      state: state,
    });
    document.getElementById(selector).innerHTML = '';
  });

  teardown(function() {
    sandbox.restore();
  });

  test('initialization', function() {

    Smartcar.init({
      clientId: 'clientId',
      redirectUri: 'redirectUri',
      scope: 'scope',
      state: state,
      forcePrompt: true,
      development: true,
      disablePopup: true,
      callback: function() { /* empty */ },
    });

    expect(Smartcar.clientId).to.equal('clientId');
    expect(Smartcar.redirectUri).to.equal('redirectUri');
    expect(Smartcar.scope).to.equal('scope');
    expect(Smartcar.grantType).to.equal('code');
    expect(Smartcar.state).to.equal(state);
    expect(Smartcar.popup).to.equal(false);
    expect(Smartcar.oemConfig.mock).to.be.an('object');
    expect(Smartcar.approvalPrompt).to.equal('force');
    expect(Smartcar.callback).to.be.a('function');

  });

  test('initialization - no state', function() {

    Smartcar.init({});
    expect(Smartcar.state).to.equal(null);

  });


  test('test link generation', function() {
    var oem = 'tesla';
    var linkedOem = Smartcar.generateLink(oem);

    var uri = 'https://' + oem +
    '.smartcar.com/oauth/authorize?' +
      'response_type=' + grantType +
      '&client_id=' + clientId +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=' + encodeURIComponent(scope.join(' ')) +
      '&approval_prompt=auto' +
      '&state=' + state;

    expect(linkedOem).to.equal(uri);

  });

  test('test link generation - no state', function() {
    Smartcar.state = false;

    var oem = 'tesla';
    var linkedOem = Smartcar.generateLink(oem);

    var uri = 'https://' + oem +
    '.smartcar.com/oauth/authorize?' +
      'response_type=' + grantType +
      '&client_id=' + clientId +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=' + encodeURIComponent(scope.join(' ')) +
      '&approval_prompt=auto';

    expect(linkedOem).to.equal(uri);

  });


  test('test generate all links', function() {

    var oemCount = Object.keys(Smartcar.oemConfig).length;
    var linkedOems = Smartcar.generateLinks();
    expect(Object.keys(linkedOems)).to.have.length(oemCount);

  });

  test('button generation', function() {

    sandbox.stub(Smartcar, '_registerPopups');
    Smartcar.generateButtons(selector);
    Object.keys(Smartcar.oemConfig).forEach(function(oem) {
      var button = document.getElementById(oem + '-button');
      expect(button).to.be.ok();
    });
    expect(Smartcar._registerPopups).to.be.calledOnce();

  });

  test('button generation without popup', function() {

    Smartcar.popup = false;
    Smartcar.generateButtons(selector);
    Object.keys(Smartcar.oemConfig).forEach(function(oem) {
      var button = document.getElementById(oem + '-button');
      expect(button).to.be.ok();
    });

  });

  test('openDialog', function() {

    sandbox.stub(window, 'open');
    Smartcar.openDialog('tesla');
    expect(window.open).to.be.calledOnce();

  });

  test('_registerPopups', function() {

    sandbox.stub(Smartcar, 'openDialog');

    // generateButtons calls _registerPopups
    Smartcar.generateButtons(selector);

    var elem = document.getElementById('tesla-button');

    // Do not worry about this
    var ev = document.createEvent('MouseEvent');
    ev.initMouseEvent('click',
      true, true, window, null,
      0, 0, 0, 0,
      false, false, false, false,
      0, null
    );

    elem.dispatchEvent(ev);
    expect(Smartcar.openDialog).to.be.calledOnce();

  });

});
