## Using Smartcar's Client JS SDK

Before integrating with Smartcar's SDK, you'll need to register a new application in the [Smartcar Developer portal](https://developer.smartcar.com).

To integrate the web client of your application with Smartcar, use the following flow:

### Loading SDK.js

Load the SDK into your webpage with the following code:

```html
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
</script>
```

The above code will generate a set of buttons with the default Smartcar OEMs that will open an OAuth popup and complete 

| Parameter       | Description   |
|:--------------- |:------------- |
| `client_id`     | **Required** Your application's client ID |
| `redirect_uri`  | **Required** RedirectURI set in application settings |
| `scope`         | **Required** Comma separated list of permissions your application requests access to |
| `callback`      | **Optional** Javascript snippet to be called upon user granting your application access |
| `grantType`     | **Optional** OAuth grant type. `code` or `token`. Defaults to `code` |
| `disablePopup`  | **Optional** Set to true to disable popups and use redirects instead |
| `oems`          | **Optional** Specify which OEMs your web application should support. Defaults to all Smartcar supported OEMs |
| `forcePrompt`   | **Optional** Force a user to the permission screen even if they've already granted access |

### Loading callback.js

If popups are being used, place `https://cdn.smartcar.com/javascript-sdk/callback-0.0.6.js` on the page your redirectURI is set to. This script will close the popup upon success and execute the code defined in `callback` upon initializing the SDK.


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
Smartcar.generateLinks('bmw');
```
Returns:

```
'https://bmw.smartcar.com/oauth/authorize?response_type=token...'
```

#### `openDialog(oem)`

Attached to a dialog `Smartcar.openDialog('bmw')` will generate an OAuth link for BMW and open a correctly sized popup when attached to a click event on a button.

