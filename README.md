# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url]

The official Smartcar Javascript SDK.

## Overview
The [Smartcar API](https://smartcar.com/docs) lets you read vehicle data (location, odometer) and send commands to vehicles (lock, unlock) to connected vehicles using HTTP requests.

To make requests to a vehicle from a web or mobile application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar Javascript SDK provides two scripts that assist with running Smartcar's authorization flow.
- `sdk.js`: attaches to the browser's window as `Smartcar`. Allows you to generate a Smartcar OAuth URL and launch Smartcar's authorization flow in a pop-up.
- `callback.js`: runs on load. This file is optional and can be served in the last page of your OAuth flow to close the popup window and call the callback function that was passed in when initializing `sdk.js`.

For more information about Smartcar's authorization flow, please visit our [API documentation](https://smartcar.com/docs#authentication).

## Quick Start
Before integrating with Smartcar's SDK, you'll need to register an application in the [Smartcar Developer portal](https://developer.smartcar.com). If you do not have access to the dashboard, please [request access](https://smartcar.com/subscribe).

The SDK helps ease the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1). A sample flow looks like this:

1. User clicks "Connect your car" button (or similar) on your application's website.
2. The user is redirected to a new page, either as a popup (if using the `openDialog` and/or `addClickHandler` methods), or in the same page (if the client redirects to the link generated by `generateLink` directly, without using `openDialog` and/or `addClickHandler`). This page requires the user authenticate with their vehicle credentials.
3. The user will be asked to authorize your application to connect to their vehicle.
4. Smartcar's services will redirect back to your application's redirectUri. The redirect will include an authorization code if the user approved the authorization, an error otherwise. An optional callback function (passed in as `onComplete`) will be invoked if `callback.js` is imported in the page served at your application's redirectUri.
5. Your application's backend server will need to accept the authorization code and exchange it for an access token.

The SDK will help facilitate the OAuth link generation, popup dialog creation, and Smartcar will handle the user authentication and authorization. This SDK will not assist with the backend server code to accept authorization codes or exchanging for access tokens (step 6).

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
  development: false, // optional
});
```
The best placement for the above code is just before the closing `</body>` tag.

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

You may embed `callback.js` in the page that is served by your redirectUri. Upon loading, this file will invoke the `onComplete` callback specified above and close the window:
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
#### Options:
| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `clientId`      | String |Application clientId obtained from [Smartcar Developer Portal](https://developer.smartcar.com). If you do not have access to the dashboard, please [request access](https://smartcar.com/subscribe). |
| `redirectUri`   | String |**Required** RedirectURI set in [application settings](https://developer.smartcar.com/apps). Given URL must match URL in application settings. |
| `scope`         | String[] |**Optional** List of permissions your application requires. This will default to requiring all scopes. The valid permission names are found in the [API Reference](https://smartcar.com/docs#get-all-vehicles). |
| `onComplete`      | Function |**Optional** Function to be invoked on completion of the Smartcar authorization flow. This function will only be invoked if `callback.js` is loaded in the page served by your redirectUri. |
| `development`   | Boolean |**Optional** Launch Smartcar auth in development mode to enable the mock vehicle brand. |

### `generateLink({options})`
##### Example
```
'https://connect.smartcar.com/oauth/authorize?response_type=token...'
```

#### Options
| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `state`         | String |**Optional** OAuth state parameter passed to the redirectUri. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

### `openDialog({options})`
#### Options
| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `state`         | String |**Optional** OAuth state parameter passed to the redirectUri. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

#### `state`
Arbitrary parameter passed to the redirectUri.

#### `forcePrompt`
Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions.

### `addClickHandler({options})`
#### Options
| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `id`         | String |**Optional** The id of the element for which to add the click handler (e.g. a "Connect your car" button). |
| `state`         | String |**Optional** OAuth state parameter passed to the redirectUri. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

## Documentation
Visit https://smartcar.com/docs for detailed documentation of the Smartcar API (with sample code!).

## What brands are supported?
The Smartcar API currently supports Tesla vehicles. We ship new brand support on a rolling basis and supported brands will appear automatically on the first screen of Smartcar's authentication flow. If you have any questions, drop us a line at hello@smartcar.com!

[ci-url]: https://travis-ci.com/smartcar/javascript-sdk
[ci-image]: https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master
