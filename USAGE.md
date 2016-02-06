## Using Smartcar's Client JS SDK

Before integrating with Smartcar's SDK, you'll need to register a new application in the [Smartcar Developer portal](https://developer.smartcar.com).

To integrate the web client of your application with Smartcar, use the following flow:

### Loading SDK.js

Load the SDK into your webpage with the following code:

```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.0.8.js"></script>
<script>
  Smartcar.init({
    clientId: 'your-client-id',
    redirectUri: 'your-redirect-uri',
    scope: ['read_vehicle_info', 'read_odometer'],
    callback: function() {
      window.location.reload;
    }
  });
</script>
```

The above code will generate a set of buttons with the default Smartcar OEMs that will open an OAuth popup and complete 

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `client_id`     | String |**Required** Your application's client ID |
| `redirect_uri`  | String |**Required** RedirectURI set in application settings |
| `scope`         | String[] |**Required** List of permissions your application requests access to |
| `callback`      | Function |**Optional** Function to be called upon user granting your application access |
| `grantType`     | String |**Optional** OAuth grant type. `code` or `token`. Defaults to `code` |
| `disablePopup`  | Boolean |**Optional** Set to true to disable popups and use redirects instead |
| `oems`          | String[] |**Optional** Specify which OEMs your web application should support. Defaults to all Smartcar supported OEMs |
| `forcePrompt`   | Boolean |**Optional** Force a user to the permission screen even if they've already granted access |

### Loading callback.js

If popups are being used, place `https://cdn.smartcar.com/javascript-sdk/callback-0.0.8.js` on the page your redirectURI is set to. This script will close the popup upon success and execute the code defined in `callback` upon initializing the SDK.


### Using the SDK to generate connect buttons 

The SDK provides a `generateButtons(selector)` method to generate a list of buttons corresponding to the OEMs provided upon SDK initialization. The function takes in a paramater a div ID, in this case `smartcar-buttons`. The function will then populate the div with the buttons and links attached to them. 
 
```html
<div id="smartcar-buttons"></div>
<script>Smartcar.generateButtons('smartcar-buttons');</script>
```

#### Result:
![](lib/buttons.png)

### Creating your own buttons

If you're planning on creating your own buttons, there are three helpful methods.

#### `generateLinks([oems])`

Returns an array with links correlated to each OEM given as a parameter. If not OEMs are given, function defaults to all OEMs.

Example:

```html
Smartcar.generateLinks(['tesla', 'bmw', 'ford']);
```
Returns:

```
['https://bmw.smartcar.com/oauth/authorize?response_type=token...', 'https://bmw.smartcar.com/oauth/authorize?response_type=token...', 'https://ford.smartcar.com/oauth/authorize?response_type=token...']

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

`Smartcar.openDialog('bmw')` will generate an OAuth link for BMW and open a correctly sized popup when attached to a click event on an element.

Example:

```javascript
document.getElementById('bmw-button').addEventListener('click', function() {
	Smartcar.openDialog('bmw');
});
```