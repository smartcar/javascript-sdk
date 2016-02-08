## Using Smartcar's Client JS SDK

Before integrating with Smartcar's SDK, you'll need to register a new application in the [Smartcar Developer portal](https://developer.smartcar.com).

The SDK helps ease the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1). The flow looks like this:

1. User clicks "Login with OEM" button on your application's website.
2. The user is redirected to a new page, either as a popup, or in the same page.
3. The user will authenticate with their vehicle credentials.
4. The user will be asked to authorize your application to connect their vehicle.
5. The user will be redirected back to your application's redirectUri with an authorization code.
6. Your application's backend server will need to accept the authorization code and exchange it for an access token.

The SDK will help facilitate the OAuth link generation, popup dialog creation, and Smartcar will handle the user authentication and authorization. This SDK will not assist with the backend server code to accept authorization codes or exchanging for access tokens (step 6).

### Loading SDK.js

On the page that will display the Login buttons, load the SDK with the following code:

```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.0.10.js"></script>
<script>
  Smartcar.init({
    clientId: 'your-client-id',
    redirectUri: 'your-redirect-uri',
    scope: ['read_vehicle_info', 'read_odometer'],
    callback: function() {
      window.location.reload();
    }
  });
</script>
```
The best placement for the above code is just before the closing `</body>` tag.

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `clientId`      | String |**Required** Your application's client ID |
| `redirectUri`   | String |**Required** RedirectURI set in application settings |
| `scope`         | String[] |**Required** List of permissions your application requests access to |
| `state`         | String |**Optional** OAuth state parameter used for identifying the user who initated the request|
| `callback`      | Function |**Optional** Function to be called upon user granting your application access when using popups|
| `grantType`     | String |**Optional** OAuth grant type. `code` or `token`. Defaults to `code` |
| `disablePopup`  | Boolean |**Optional** Set to true to disable popups and use redirects instead |
| `forcePrompt`   | Boolean |**Optional** Force a user to the permission screen even if they've already granted access |
| `development`   | Boolean |**Optional** Set to `true` to add a Mock OEM for testing |

### Loading callback.js

If popups are being used, place the callback script on the page your redirectURI is set to. This script will close the popup upon success and execute the code defined in `callback` upon initializing the SDK.

```html
<!-- https://example.com -->
<script>
  Smartcar.init({
    callback: function() {
      window.location.reload();
    }
  })
</script>
```

```html
<!-- https://example.com/callback -->
<script src="https://cdn.smartcar.com/javascript-sdk/callback-0.0.10.js"></script>
```

### Supported OEMs

Currently the SDK supports the following OEMs:

+ `bmw`
+ `ford`
+ `lexus`
+ `tesla`
+ `volvo`
+ `mock` (fake OEM used for testing, ensure `development` is set to `true` prior to using)

### Using the SDK to generate connect buttons

The SDK provides a `generateButtons(selector)` method to generate a list of buttons corresponding to the OEMs provided upon SDK initialization. The function takes in a div ID, in this case `smartcar-buttons`. The function will then populate the div with the buttons and links attached to them.

```html
<div id="smartcar-buttons"></div>
<script>Smartcar.generateButtons('smartcar-buttons');</script>
```

#### Result:
![](lib/buttons.png)

### Creating your own buttons

If you're planning on creating your own buttons, there are three helpful methods.

#### `generateLinks([oems])`

Returns an array with links correlated to each OEM given as a parameter. If no OEMs are given, the function defaults to all OEMs.

Example:

```html
Smartcar.generateLinks(['tesla', 'bmw', 'ford']);
```

Returns:

```
{
  tesla: 'https://tesla.smartcar.com/oauth/authorize?response_type=token...',
  bmw: 'https://bmw.smartcar.com/oauth/authorize?response_type=token...',
  ford: 'https://ford.smartcar.com/oauth/authorize?response_type=token...'
}
```

#### `generateLink(oem)`

Example:

```html
Smartcar.generateLink('bmw');
```

Returns:

```
'https://bmw.smartcar.com/oauth/authorize?response_type=token...'
```

#### `openDialog(oem)`

`Smartcar.openDialog('bmw')` will generate an OAuth link for BMW and open a correctly sized popup. For example, you could call it on the click event of your own custom button:

Example:

```javascript
document.getElementById('bmw-button').addEventListener('click', function() {
  Smartcar.openDialog('bmw');
});
```
