suite('Smartcar Auth SDK', function() {

  var clientId = 'ab3f8354-49ed-4670-8f53-e8300d65b387';
  var redirectUri = 'http://localhost:5000/callback';
  var scope = ['read_vehicle_info', 'read_odometer'];
  var selector = 'smartcar-buttons';
  var grantType = 'token';
  var redirectType = 'popup';

  suiteSetup(function() {

    Smartcar.init({
      clientId: clientId,
      redirectUri: redirectUri,
      scope: scope,
      selector: selector,
      grantType: grantType,
      redirectType: redirectType
    });

  });

  test('test link generation', function() {
    var oem = 'tesla';
    var linkedOem = Smartcar.generateLink(oem);

    var uri = 'https://' + oem
      + '.smartcar.com/oauth/authorize?'
      + 'response_type=' + grantType
      + '&client_id=' + clientId
      + '&redirect_uri=' + encodeURIComponent(redirectUri)
      + '&scope=' + encodeURIComponent(scope.join(' '))
      + '&approval_prompt=auto';

    expect(linkedOem.name).to.equal(oem);
    expect(linkedOem.link).to.equal(uri);

  });

  test('button generation', function() {

    Smartcar.generateButtons(function() {
      var count = 0;
      Smartcar.oems.forEach(function(oem) {
        var button = document.getElementById(oem + '-button');
        count++;
        expect(button).to.be.ok;
      });

      expect(count).to.equal(Smartcar.oems.length);

    });

  });

  test('initialization' , function() {

    Smartcar.init({
      clientId: 'clientId',
      redirectUri: 'redirectUri',
      scope: 'scope',
      selector: 'selector',
      grantType: 'token',
      popup: true,
      oems: ['oem1', 'oem2'],
      forcePrompt: true
    });

    expect(Smartcar.clientId).to.equal('clientId');
    expect(Smartcar.redirectUri).to.equal('redirectUri');
    expect(Smartcar.scope).to.equal('scope');
    expect(Smartcar.selector).to.equal('selector');
    expect(Smartcar.grantType).to.equal('token');
    expect(Smartcar.popup).to.equal(true);
    expect(Smartcar.oems[0]).to.equal('oem1');
    expect(Smartcar.oems[1]).to.equal('oem2');
    expect(Smartcar.approvalPrompt).to.equal('force');

  });


});
