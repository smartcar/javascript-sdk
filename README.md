# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url]

The official Smartcar Javascript SDK.

## Overview
The [Smartcar API](https://smartcar.com/docs) lets you read vehicle data (location, odometer) and send commands to vehicles (lock, unlock) to connected vehicles using HTTP requests.

To make requests to a vehicle from a web or mobile application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar Javascript SDK provides two scripts that assist with running Smartcar's authorization flow.
- `sdk.js`: attaches to the browser's window as `Smartcar`. Allows you to generate a Smartcar OAuth URL and launch Smartcar's authorization flow in a pop-up.
- `callback.js`: runs on load. This file is optional and can be served in the last page of your OAuth flow to close the popup window and call the callback function that was passed in when initializing `sdk.js`.

For more information about Smartcar's authorization flow, please visit our [API documentation](https://smartcar.com/docs#authentication).

## Quick Start
Before integrating with Smartcar's SDK, you'll need to register a new application in the [Smartcar Developer portal](https://developer.smartcar.com). If you do not have access to the dashboard, please [request access](https://smartcar.com/subscribe).

The SDK helps ease the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1). A sample flow looks like this:

1. User clicks "Connect your car" button (or similar) on your application's website.
2. The user is redirected to a new page, either as a popup, or in the same page.
3. The user will authenticate with their vehicle credentials.
4. The user will be asked to authorize your application to connect their vehicle.
5. The user will be redirected back to your application's redirectUri with an authorization code. An optional callback function (passed in as `onComplete`) will be invoked when the OAuth flow completes.
6. Your application's backend server will need to accept the authorization code and exchange it for an access token.

The SDK will help facilitate the OAuth link generation, popup dialog creation, and Smartcar will handle the user authentication and authorization. This SDK will not assist with the backend server code to accept authorization codes or exchanging for access tokens (step 6).

### Parameters
These parameters are used throughout the Smartcar Javascript SDK:

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `clientId`      | String |**Required** Your application's client ID |
| `redirectUri`   | String |**Required** RedirectURI set in [application settings](https://developer.smartcar.com/apps) |
| `scope`         | String[] |**Optional** List of permissions your application requests access to |
| `state`         | String |**Optional** OAuth state parameter used for identifying the user who initiated the request |
| `onComplete`      | Function |**Optional** Function to be called upon user granting your application access when using popups |
| `forcePrompt`   | Boolean |**Optional** Force a user to the permission screen even if they've already granted access |

### Code Sample
```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.0.10.js"></script>
<script>
  const smartcar = new Smartcar({
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


### Import `sdk.js`:
```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.1.0.js"></script>
```

### Use `sdk.js`:
Initialize:
```javascript
const smartcar = new Smartcar({
  clientId: `your-client-id`,
  redirectUri: `your-redirect-uri`,
  scope: ['read_vehicle_info', 'read_odometer'], // optional
  onComplete: function() { // optional
    window.location.reload();
  },
});
```
To open the Smartcar OAuth dialog directly:
```javascript
// note: state and forcePrompt are optional
smartcar.openDialog({state, forcePrompt});
```

To add a click handler to an HTML element that will open the Smartcar OAuth dialog:
```javascript
// note: state and forcePrompt are optional
smartcar.addClickHandler({id, state, forcePrompt});
```

You may embed `callback.js` in the page that is served by your redirect uri. Upon loading, this file will invoke the `onComplete` callback specified above and close the window:
```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-0.1.0.js"></script>
```

To retrieve the Smartcar OAuth URL (useful in single page applications when redirecting to Smartcar's OAuth flow in a new tab):
```javascript
// note: state and forcePrompt are optional
smartcar.generateLink({state, forcePrompt});
```

## Installation
You can import this SDK into your application from Smartcar's CDN:

### sdk.js
```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-0.1.0.js"></script>
```

### callback.js
```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-0.1.0.js"></script>
```

## Configuration
### `new Smartcar({options})`

#### `clientId`
Application client ID obtained from [Smartcar Developer Portal](https://developer.smartcar.com). If you do not have access to the dashboard, please [request access](https://smartcar.com/subscribe).

#### `redirectUri`
Given URL must match URL in application settings.

#### `scope` (optional)
Permissions requested from the user for specific grant. This is an optional parameter, and will default to requiring all scopes. A space separated list of permissions your application is requesting access to. The valid permission names are found in the [API Reference](https://smartcar.com/docs#get-all-vehicles).

#### `onComplete`
Action to perform upon completion of the Smartcar authorization flow. This function will only be invoked if `callback.js` is loaded in the page served by your redirect URI.

### `generateLink({options})`
##### Example
```
'https://connect.smartcar.com/oauth/authorize?response_type=token...'
```

#### `state`
Arbitrary parameter passed to the redirect uri.

#### `forcePrompt`
Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permission.

### `openDialog({options})`

#### `state`
Arbitrary parameter passed to the redirect uri.

#### `forcePrompt`
Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permission.

### `addClickHandler({options})`

#### `id`
The id of the element for which to add the click handler (e.g. a "Connect your car" button).

#### `state`
Arbitrary parameter passed to the redirect uri.

#### `forcePrompt`
Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permission.

## Documentation
Visit https://smartcar.com/docs for detailed documentation of the Smartcar API (with sample code!).

## What brands are supported?
The Smartcar API currently supports Tesla vehicles. We ship new brand support on a rolling basis and supported brands will appear automatically on the first screen of Smartcar's authentication flow. If you have any questions, drop us a line at hello@smartcar.com!

[ci-url]: https://travis-ci.com/smartcar/javascript-sdk
[ci-image]: https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master
