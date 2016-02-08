# Smartcar JS Client SDK [![Build Status](https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master)](https://travis-ci.com/smartcar/javascript-sdk) [![Coverage Status](https://coveralls.io/repos/github/smartcar/javascript-sdk/badge.svg?branch=master&t=sqGPnl)](https://coveralls.io/github/smartcar/javascript-sdk?branch=master)

The Smartcar Javascript SDK provides a script to generate OEM connect buttons for users to use to login in with their vehicles.

## Basic Usage

The code below will initiate the Client SDK with the minimum configuration options and display OAuth buttons with every Smartcar supported OEM.

```html
<div id="smartcar-buttons"></div>

<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.0.9.js"></script>
<script>
	Smartcar.init({
		clientId: 'your-client-id',
		redirectUri: 'your-redirect-uri',
		scope: ['read_vehicle_info', 'read_odometer'],
	});

	Smartcar.generateButtons('smartcar-buttons');
</script>
```

The result will be as follows:
![](lib/buttons.png)

Add the below script to your redirectUri callback page to handle closing the OAuth popup and reloading the current page to update it with information retrieved with the newly obtained token.


```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-0.0.9.js"></script>
```

## Configuration

### `Smartcar.init({options})`

#### `clientId`
Application client ID obtained from [Smartcar Developer Portal](https://developer.smartcar.com).

#### `redirectUri`
Given URL must match URL in application settings.

#### `scope`
Permissions requested from the user for specific grant.

#### `state`
OAuth state parameter. Typically used for passing a user's ID or token to prevent CORS attacks

#### `selector`
ID of html element that will contain the generated buttons.

#### `grantType` (optional)
Defaults to `code`.
`code` is used for a server-side OAuth transaction.

`token` sends back a 2 hour token typically used for client-side applications.

#### `disablePopup` (optional)
Defaults to `false`. To disable a popup, and redirect to a different page instead, set to `true`.

#### `forcePrompt` (optional)

Set to `force` to force a user to re-grant permissions.

#### `callback`

Action to perform upon popup callback finish. Regularly used to call `window.location.reload();`.


## Auxillary Functions

### `generateLink(oemName)`

Call `Smartcar.generateLink('bmw')` to receive an object with the oemName and a fully configured OAuth dialog URL.

##### Example
```
'https://bmw.smartcar.com/oauth/authorize?response_type=token...'
```

### `generateButtons(oems)`
`Smartcar.generateButtons()` will retrieve passed in OEMs and generate the appropriate buttons into specified DOM selector. If no OEMs are passed in as a parameter, the functions defaults to all OEMs.

### `openDialog(oemName)`
Bind `Smartcar.openDialog('tesla')` to a click event to open a fully configured popup of that OEM. Calling the function without a user triggered click event will prevent the popup from showing up.

