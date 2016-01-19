# Smartcar JS Client SDK [![Build Status](https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master)](https://travis-ci.com/smartcar/javascript-sdk) [![Coverage Status](https://coveralls.io/repos/github/smartcar/javascript-sdk/badge.svg?branch=master&t=sqGPnl)](https://coveralls.io/github/smartcar/javascript-sdk?branch=master)

The Smartcar Javascript SDK provides a script to generate OEM connect buttons for users to use to login in with their vehicles.

## Basic Usage

The code below will initiate the Client SDK with the minimum configuration options and display OAuth buttons with every Smartcar supported OEM.

```html
<div id="smartcar-buttons"></div>
<script src="scripts/sdk.js"></script>
<script>
	Smartcar.init({
		clientId: 'your-client-id',
		redirectUri: 'your-redirect-uri',
		scope: ['read_vehicle_info', 'read_odometer'],
		selector: 'smartcar-buttons',
	});

	Smartcar.generateButtons();
</script>
```

The result will be as follows:
![](lib/buttons.png)

Add the below script to your redirectUri callback page to handle closing the OAuth popup and reloading the current page to update it with information retrieved with the newly obtained token.


```html
<script src="scripts/callback.js"></script>
```

## Configuration

### `Smartcar.init({options})`

#### `clientId`
Application client ID obtained from [Smartcar Developer Portal](https://developer.smartcar.com).

#### `redirectUri`
Given URL must match URL in application settings.

#### `scope`
Permissions requested from the user for specific grant.

#### `selector`
ID of html element that will contain the generated buttons.

#### `grantType` (optional)
Defaults to `code`.
`code` is used for a server-side OAuth transaction.

`token` sends back a 2 hour token typically used for client-side applications.

#### `disablePopup` (optional)
Defaults to `false`. To disable a popup, and redirect to a different page instead, set to `true`.

#### `oems` (optional)
Specify Smartcar-compatible OEMs to generate buttons for. Defaults to entire set of compatible Smartcar OEMs.

#### `forcePrompt` (optional)

Set to `force` to force a user to re-grant permissions.


#### `callback`

A function that is called in `callback.js` in the redirect page.

## Auxillary Functions

### `generateLink(oemName)`

Call `Smartcar.generateLink('bmw')` to receive an object with the oemName and a fully configured OAuth dialog URL.

##### Example
```
{
	name: 'bmw',
	link: 'https://bmw.smartcar.com/oauth/authorize?response_type=token...'
}
```

### `generateButtons(callback)`
`Smartcar.generateButtons()` will retrieve OEMs set on init and generate the appropriate buttons into specified DOM selector. To generate a different set of OEM buttons, set the OEM names on the `Smartcar.oems` array. An optional callback can be included on completion.

### `openDialog(oemName)`
Bind `Smartcar.openDialog('tesla')` to a click event to open a fully configured popup of that OEM. Calling the function without a user triggered click event will prevent the popup from showing up.

