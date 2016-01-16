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

});
