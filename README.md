# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url] [![GitHub tag][tag-image]][tag-url]

The official Smartcar Javascript SDK

## Overview

The [Smartcar API](https://smartcar.com/docs) lets you read vehicle data (location, odometer) and send commands (lock, unlock) to connected vehicles using HTTP requests.

<!-- do we want to mention mobile here? in my mind just muddies the waters -->
To make requests to a vehicle from a web or mobile application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar Javascript SDK provides two scripts that assist with running Smartcar's authorization flow.

- `sdk.js`: Sourced on the page your authorization flow begins from. Attaches to the browser's window as `Smartcar`. Allows you to generate a Smartcar OAuth URL and launch Smartcar's authorization flow in a pop-up.
- `redirect.js`: Sourced on redirect page following completion of OAuth flow. Runs on load. This *optional* file can be served in the last page of your OAuth flow to close the popup window and trigger firing of an optional `onComplete` method passed to the `Smartcar` constructor from `sdk.js`. If you use a Smartcar hosted redirect (explained in greater detail below) this file is automatically served and the `onComplete` method becomes required.

For more information about Smartcar's authorization flow, please visit our [API documentation](https://smartcar.com/docs#authentication).

## Quick Start

<!-- TODO: where are supported brands listed in the dashboard? -->

Before integrating with Smartcar's SDK, you'll need to register an application in the [Smartcar Developer portal](https://dashboard.smartcar.com). Supported brands are listed in this dashboard.

The SDK helps ease the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1).

We offer a choice of using a Smartcar hosted redirect or hosting your own. This choice is made when you add redirect URIs in the developer dashboard and influences how you use this SDK. As a developer there are several key differences between the two strategies.

<!-- do we prefer the `${}` form of indicating user written content or something else like <your-client-uri-here> -->
First, if you use `Smartcar` hosting you will add a redirect URI to your application of the form `https://javascript-sdk.smartcar.com/redirect?app_origin=${your-client-uri-here}`. So for example, if your application URI was `https://my-awesome-app.com` you'd add the following redirect URI to your app in the dashboard: `https://javascript-sdk.smartcar.com/redirect?app_origin=https://my-awesome-app.com`. Note, this value is only your app's origin, if your application was at `https://my-awesome-app.com/application` you would still have the example redirect URI listed without the `/application`. Any restrictions on normal redirect URIs (like requiring `https` when not using `localhost` still apply to the value you give for `app_origin`). See the [Register](https://smartcar.com/docs#register) section of our docs for valid formats.

Second, if you `Smartcar` hosting you must provide an `onComplete` function with the following signature `onComplete(err, code, state <optional>)` to the Smartcar constructor. This `onComplete` method will be called when the user completes the authorization flow. If they approved access you'll need to exchange the `code` parameter for an access token, otherwise you'll need to handle the given `err` parameter holding the error.

If you host the redirect yourself you can provide any valid redirect URI (see the [Register](https://smartcar.com/docs#register) section of our docs) and `onComplete` is optional. You may source `redirect.js` in your redirect popup to close out the window and trigger firing of the `onComplete` (if you've provided one to the `Smartcar` constructor).

Here are example flows for each method:

### Example Flows

#### Smartcar Hosted

1. User clicks "Connect your car" button (or similar) on your application's website.
2. The user is redirected to an OAuth authentication page, using the `openDialog` or `addClickHandler` methods. This page requires the user to authenticate with their vehicle credentials. **Note**: because the Smartcar hosted redirect page uses `postMessage` to communicate the access code back to the client page the redirect page must be opened in a separate window.
3. After entering credentials the user will be presented with a list of their vehicles to authorize and a selection of permissions to allow your app.
4. Once they've selected their vehicles & permissions Smartcar's services will redirect to the Smartcar hosted redirect URI. This page will load `redirect.js` which will post a message to the original client page that opened the redirect. The `skd.js` script loaded on the client page handles this redirect, calling the required `onComplete` method provided to the constructor. The `onComplete` method you provided must handle an error if the user refused authorization or sending the code to your backend to exchange for an access token if the user authorized your application.
5. Your application's backend server will need to accept the authorization code and exchange it for an access token.

<!-- depending on timing this probably won't make it to initial launch of redirect scheme -->
For a more detailed explanation of our Smartcar hosted redirect scheme see our [blog post](TODO: LINK HERE?) on the topic.

#### Self Hosted

Here's an example flow should you host the redirect yourself (many of the steps remain similar):

1. User clicks "Connect your car" button (or similar) on your application's website.
2. The user is redirected to an OAuth authentication page, using the `openDialog`, `addClickHandler` or `generateLink` methods. This page requires the user to authenticate with their vehicle credentials.
3. After entering credentials the user will be presented with a list of their vehicles to authorize and a selection of permissions to allow your app.
4. Smartcar's services will redirect back to your application's redirect URI. The redirect URI will include an authorization code query parameter if the user approved the authorization, an error query parameter otherwise. If you import the `redirect.js` script at the redirect URI it will trigger execution of your optionally provided `onComplete` method (passed to the `Smartcar` constructor) and close out the redirect page. **Note:** in the Smartcar hosted scheme `redirect.js` handles extracting the query parameters from the redirect URI. In a manual hosting scheme you can choose to do this extraction client (making use of `redirect.js` if you'd like) or server side.
5. Your application's backend server will need to accept the authorization code and exchange it for an access token.

<!-- some delineation here? feels kind of loose after the two flows -->

This SDK will help facilitate OAuth link generation, popup dialog creation, and Smartcar will handle user authentication and authorization. This SDK will not assist in exchanging authorization codes for an access token. Should you choose to self host the redirect this SDK will not assist with extracting the authorization code query parameter from the redirect URI.

### Usage

### Import `sdk.js`

Import `sdk.js` on your client. Call the `Smartcar` constructor then use one of its instance methods to setup the authorization flow.

```html
<script src="https://javascript-sdk.smartcar.com/sdk-2.0.0.js"></script>
```

### Use `sdk.js`

Initialize:

```javascript
const smartcar = new Smartcar({
  clientId: `your-client-id`,
  redirectUri: `your-redirect-uri`,
  // optional, defaults to all scopes
  scope: ['read_vehicle_info', 'read_odometer'],
  // if using smartcar hosting this is required and must take at least two
  // arguments - error & code
  // otherwise optional (will be called with the same arguments but is not
  // required to handle them)
  onComplete: function(error, code, state <optional>) {
    // actions to take on completion of auth flow
    // if using smartcar hosting this should send the code to your backend
    // server to exchange for an access token
  },
  development: false, // optional, defaults to false
  useSmartcarHostedRedirect: true, // optional, defaults to false
});
```

<!-- TODO: this strikes me as odd advice? why suggest where they put the code? -->
The best placement for the above code is just before the closing `</body>` tag.

<!-- TODO: why show state and forcePrompt in this? just seems to add unnecessary disclaimers -->

Once initialized there are three instance methods for setting up the OAuth flow:

- `openDialog()` - to open the Smartcar OAuth dialog directly
- `addClickHandler({id})` - to add a click handler to an HTML element that will open the Smartcar OAuth dialog
<!-- TODO: what is this section trying to communicate? is the 'useful in a single page app...' portion still relevant? -->
- `generateLink()` - to generate the bare Smartcar OAuth URL (useful in single page applications when redirecting to Smartcar's OAuth flow in a new tab)

See the [reference below](TODO: link to appropriate section) for detailed signature information.

<!-- organization of this whole section a little awkward with this ending another example of the awkwardness -->
You may optionally embed `redirect.js` in the page that is served by your redirect URI. Upon loading, this file will trigger invocation of the `onComplete` callback specified above by posting to the client and will close out the redirect window:

```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-1.0.0.js"></script>
```

## Installation

You can import this SDK into your application from Smartcar's CDN:

### sdk.js

```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-1.0.0.js"></script>
```

### redirect.js

```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-1.0.0.js"></script>
```

## Configuration

### `new Smartcar({options})`

#### Options:
| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `clientId`      | String |Application clientId obtained from [Smartcar Developer Portal](https://dashboard.smartcar.com). |
| `redirectUri`   | String |**Required** Redirect URI set in [application settings](https://dashboard.smartcar.com/apps). Given URL must match URL in application settings. To use Smartcar hosting this URI must be of the form `https://javascript-sdk.smartcar.com/redirect?app_origin=${your client URI here}` |
| `scope`         | String[] |**Optional** List of permissions your application requires. This will default to requiring all scopes. The valid permission names are found in the [API Reference](https://smartcar.com/docs#get-all-vehicles). |
| `onComplete`      | Function |**Optional** Function to be invoked on completion of the Smartcar authorization flow. This function will only be invoked if `redirect.js` is loaded in the page served at your redirect URI. |
| `development`   | Boolean |**Optional** Launch Smartcar auth in development mode to enable the mock vehicle brand. |


<!-- TODO: I think it might be useful to consolidate the three instance methods reference as they are so similar outside of the `id` parameter to `addClickHandler` but want to get others' thoughts before doing so -->
### `generateLink({options})`

**Note:** if you use Smartcar hosting you *MUST* open the redirect page in a separate window from your client in order for `postMessage` to succeed.

#### Example

```
'https://connect.smartcar.com/oauth/authorize?response_type=token...'
```

#### Options

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `state`         | String |**Optional** OAuth state parameter passed to the redirect URI. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

### `openDialog({options})`

#### Options

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `state`         | String |**Optional** OAuth state parameter passed to the redirect URI. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

### `addClickHandler({options})`

#### Options

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `id`         | String |**Optional** The id of the element for which to add the click handler (e.g. a "Connect your car" button). |
| `state`         | String |**Optional** OAuth state parameter passed to the redirect URI. This parameter may be used for identifying the user who initiated the request. |
| `forcePrompt`   | Boolean |**Optional** Setting `forcePrompt` to `true` will show the permissions approval screen on every authentication attempt, even if the user has previously consented to the exact scope of permissions. |

## Documentation

Visit [https://smartcar.com/docs](https://smartcar.com/docs) for detailed documentation of the Smartcar API (with sample code!).

[ci-image]: https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master
[tag-url]: https://github.com/smartcar/javascript-sdk/tags
[tag-image]: https://img.shields.io/github/tag/smartcar/javascript-sdk.svg
