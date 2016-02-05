## Getting Started with Smartcar's Client JS SDK

Before integrating with Smartcar's SDK, you'll need to register a new application in the [Smartcar Developer portal](https://developer.smartcar.com).

To integrate your third-party web server application with Smartcar, use the following flow:

### 1. Load the SDK

`GET https://cdn.smartcar.com/javascript-sdk/sdk-0.0.6.js`
`GET https://cdn.smartcar.com/javascript-sdk/callback-0.0.6.js`

Load the SDK into your webpage with the following code:
```
<div id="smartcar-buttons"></div>
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.0.6.js"></script>
<script>
  Smartcar.init({
    clientId: 'your-client-id',
    redirectUri: 'your-redirect-uri',
    scope: ['read_vehicle_info', 'read_odometer'],
    callback: function() {
      window.location.reload;
    }
  });

  Smartcar.generateButtons('smartcar-buttons');
</script>
```

The above code snippet will generate a set of buttons with the default Smartcar OEMs that will open a an OAuth popup and complete

| Parameter       | Description   |
|:--------------- |:------------- |
| `client_id`     | **Required** Your application's client ID |
| `redirect_uri`  | **Required** RedirectURI set in application settings |
| `scope`         | **Required** Comma separated list of permissions your application requests access to. |
| `callback`      | **Optional** Javascript snippet to be called upon popup completion |
| `grantType`     | **Optional** OAuth grant type. `code` or `token`. Defaults to `code`.      |
| `disablePopup`  | **Optional** Set to true to disable popups and use redirects instead      |
| `oems`          | **Optional** Specify which OEMs your web application should support, defaults to all Smartcar supported OEMs      |
| `forcePrompt`   | **Optional** Force a user to the permission screen even if they've already granted access      |

### Load the callback SDK on your redirect URI

If popups are being used, place `https://cdn.smartcar.com/javascript-sdk/callback-0.0.6.js`

### 2. Smartcar redirects back to your site

If the user approves your application, Smartcar will redirect them back to your redirect_uri with a temporary code parameter.

Example of the redirect:

```
GET https://yourapp.com/callback?code=4c666b5c0c0d9d3140f2e0776cbe245f3143011d82b7a2c2a590cc7e20b79ae8
```

