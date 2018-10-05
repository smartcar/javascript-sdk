# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url] [![GitHub tag][tag-image]][tag-url]

The official Smartcar JavaScript SDK

## Overview

Smartcar is the connected car [API](https://smartcar.com/docs) that allows mobile and web apps to communicate with connected vehicles across brands (think “check odometer” or “unlock doors.”)

To make requests to a vehicle from a web application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar JavaScript SDK provides two scripts that assist with running this flow.

- `sdk.js`: Sourced on the page on which your authorization flow begins. Attaches to the browser's window as `Smartcar`. Allows you to generate a Smartcar OAuth URL and to launch Smartcar's authorization flow in a pop-up.
- `redirect.js`: Sourced on redirect page following completion of OAuth flow. Runs on load. This *optional* file can be served in the last page of your OAuth flow to close the pop-up window and trigger firing of an optional `onComplete` method passed to the `Smartcar` constructor from `sdk.js`. If you use a Smartcar-hosted redirect (explained in greater detail below), this file is automatically served and the `onComplete` method becomes required.

For more information about Smartcar's authorization flow, please visit our [API documentation](https://smartcar.com/docs#authentication).

## Why Use This

This SDK facilitates OAuth link generation, click handler creation, and pop-up dialog creation. A user must authenticate their vehicles with your application to use it. Smartcar handles the majority of this process, but you need to handle the launch of the authentication flow and the redirect after completion of the flow.

This SDK provides functions that assist in launching the authentication flow. Additionally, the `redirect.js` script helps extract the authorization code from a redirect.

In conjunction with this SDK, Smartcar simplifies redirect handling through Smartcar-hosted redirects. If you use a Smartcar-hosted redirect, we handle extracting the authorization code, and then pass it to an `onComplete` function, which you provide.

## Quick Start

Before integrating with Smartcar's SDK, you'll need to register an application in the [developer dashboard](https://dashboard.smartcar.com).

You have the choice between using a Smartcar-hosted redirect or hosting your own. This choice is made when you add redirect URIs in the developer dashboard, and it influences how you use this SDK. There are several key differences between the two strategies.

First, if you choose a Smartcar-hosted redirect you will add a redirect URI of the form `https://javascript-sdk.smartcar.com/redirect-{version}?app_origin={your-client-origin-here}` to your application. For example, if your client is served at `https://my-awesome-app.com` you will add the following redirect URI to your app in the dashboard: `https://javascript-sdk.smartcar.com/redirect-2.0.0?app_origin=https://my-awesome-app.com`. Note: this value is only your app's origin. If your client is served at `https://my-awesome-app.com/application` you will add the same example redirect URI, leaving out the `/application` in the `app_origin`. This `app_origin` URL (your client) must be either an HTTP localhost or HTTPS URL. See the [Register](https://smartcar.com/docs#redirect-uris) section of our docs for valid formats.

Secondly, if you choose a Smartcar-hosted redirect, you must also provide an `onComplete` function with the signature `onComplete(error, code, [state])` to the Smartcar constructor. This `onComplete` method will be called when the user completes the authorization flow. If they approve access you'll need to exchange the `code` parameter for an access token. If they deny access you'll need to handle the error (which is passed in the `error` argument).

If you decide to host the redirect yourself, you can provide any valid redirect URI (see the [Register](https://smartcar.com/docs#redirect-uris) section of our docs) and `onComplete` is optional. You may source `redirect.js` in your redirect pop-up to close out the window and trigger firing of the `onComplete` (if you've provided one to the `Smartcar` constructor).

Below, you will find example flows for each method.

### Example Flows

#### Smartcar-Hosted

1. User clicks "Connect your car" button (or similar button) on your application's website.
2. User is redirected to an OAuth authentication page, using the `openDialog` or `addClickHandler` methods. This page requires the user to authenticate with their vehicle credentials.

    *Note:* Due to the implementation of `redirect.js`, the redirect page must be opened in a separate window.
3. After entering their credentials, the user will be presented with a list of their vehicles to authorize and a selection of permissions to grant your app.
4. Once the user has selected their vehicle and selected permissions, this SDK will automagically trigger the `onComplete` function you provide with the authorization code or an error. If called with a code, you must send this code to your back end to then exchange it with Smartcar for an access token.

    *Note:* Okay, so, about that automagically... Here's what happens behind the scenes: Let's say your website is `https://my-amazing-app.com`. Following the OAuth flow the user is redirected to a Smartcar-hosted redirect URI `https://javascript-sdk.smartcar.com/redirect-2.0.0?app_origin=https://my-amazing-app.com&code={authorization-code}`. This page sources `redirect.js` which uses `postMessage` to send a message with the authorization code or error to the origin specified by the `app_origin` query param `https://my-amazing-app.com`. The redirect page then closes itself out. On `https://my-amazing-app.com` the Smartcar instance you created receives the posted message and fires your `onComplete` method with the appropriate arguments. From your user's perspective, all they'll see is a brief flicker of the redirect page before it closes out, depending on their connection speed.
5. Your application's back end server will need to accept the authorization code and exchange it for an access token.

For a more detailed explanation of our Smartcar-hosted redirect scheme see our [blog post](TODO: LINK HERE) on the topic.

#### Self-Hosted

Here's an example flow for the case that you host the redirect yourself (many of the steps remain similar):

1. User clicks "Connect your car" button (or similar button) on your application's website.
2. User is redirected to an OAuth authentication page, using the `openDialog`, `addClickHandler`, or `generateLink` methods. This page requires the user to authenticate with their vehicle credentials.
3. After entering their credentials, the user will be presented with a list of their vehicles to authorize and a selection of permissions to grant your app.
4. Smartcar's services will redirect back to your application's redirect URI. If the user approves the authorization, the redirect URI will include a `code` query parameter holding the authorization code. If they deny access, the URI will include `error` and `error_description` parameters. If you source `redirect.js` on your redirect page, it will trigger execution of your optionally provided `onComplete` method (passed to the `Smartcar` constructor on the client) and close out the redirect page.

    *Note:* in the Smartcar-hosted scheme, `redirect.js` handles extracting the query parameters from the redirect URI. In a manual hosting scheme, you can choose to do this extraction client side (making use of `redirect.js` if you'd like) or the server side. If the user approves access, you'll need to exchange the `code` parameter for an access token. If they deny access, you'll need to handle the error (passed as the first argument).
5. Your application's back end server will need to accept the authorization code and exchange it for an access token.

## Next Steps

This SDK facilitates OAuth link generation, click handler creation, and pop-up dialog creation. This SDK will not assist in exchanging authorization codes for an access token. If you choose to self-host the redirect, this SDK provdes a script you can source on the redirect that will assist you with extracting the authorization code query parameter.

See the links below to various SDKs that can help you exchange the authorization code for an access token. If the back end language you want to use isn't listed below, you can still use the Smartcar API. You will just have to make HTTP requests manually based on our [API specification](https://smartcar.com/docs#get-all-vehicles).

- [Node](https://github.com/smartcar/node-sdk)
- [Python](https://github.com/smartcar/python-sdk)
- [Java](https://github.com/smartcar/java-sdk)

### Usage

### Import `sdk.js`

Import `sdk.js` on your client. Call the `Smartcar` constructor. Then use one of the constructor's instance methods to set up the authorization flow.

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
  // if using smartcar-hosting this is required and must take at least two
  // arguments - error & code
  // otherwise optional (will be called with the same arguments but is not
  // required to handle them)
  onComplete: function(error, code, [state]) {
    // actions to take on completion of auth flow
    // if using smartcar-hosting this should send the code to your back end
    // server to exchange for an access token
  },
  development: false, // optional, defaults to false
  useSmartcarHostedRedirect: true, // optional, defaults to false
});
```

Here's an example `onComplete` function:

```javascript
function(error, code
if (error) {
  // redirect user to error page
} else {
  // using the axios library
  // posting to a domain specified by SERVER variable
  axios
    .post(`${SERVER}/auth`, {code})
    .then((_) => {
      // take action now that authorization is complete
      // maybe pull odometer or location and display to your user?
      // at this point the limit is your own creativity :)
    });
}
```

<!-- TODO: why show state and forcePrompt in this? just seems to add unnecessary disclaimers -->
<!-- TODO: give examples of usage for each instance method -->

Once initialized there are three instance methods for setting up the OAuth flow:

- `openDialog()` - to open the Smartcar OAuth dialog directly
- `addClickHandler({id})` - to add a click handler to an HTML element that will open the Smartcar OAuth dialog
- `generateLink()` - to generate the bare Smartcar OAuth URL

See the [reference below](TODO: link to appropriate section) for detailed signature information.

## Installation

You can import this SDK into your application from Smartcar's CDN:

### sdk.js

```html
<script src="https://cdn.smartcar.com/javascript-sdk/sdk-1.0.0.js"></script>
```

### redirect.js

Automatically sourced if you use a Smartcar-hosted redirect.

```html
<script src="https://cdn.smartcar.com/javascript-sdk/callback-1.0.0.js"></script>
```

## Configuration

### `new Smartcar({options})`

#### Options

| Parameter       | Type | Description   |
|:--------------- |:---|:------------- |
| `clientId`      | String |Application clientId obtained from [Smartcar Developer Portal](https://dashboard.smartcar.com). |
| `redirectUri`   | String |**Required** Redirect URI set in [application settings](https://dashboard.smartcar.com/apps). Given URI must match URI in application settings. To use Smartcar-hosting, this URI must be of the form `https://javascript-sdk.smartcar.com/redirect?app_origin=<your client URI here>` |
| `scope`         | String[] |**Optional** List of permissions your application requires. This will default to requiring all scopes. The valid permission names can be found in the [API Reference](https://smartcar.com/docs#get-all-vehicles). |
| `onComplete`      | Function |**Optional** Function to be invoked on completion of the Smartcar authorization flow. This function will only be invoked if `redirect.js` is loaded in the page served at your redirect URI. |
| `development`   | Boolean |**Optional** Launch Smartcar auth in development mode to enable the mock vehicle brand. |

### `generateLink({options})`

*Note:* Due to the implementation of `redirect.js`, the redirect page **must** be opened in a separate window.

#### Example

```text
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
