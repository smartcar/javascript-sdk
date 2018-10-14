# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url] [![GitHub tag][tag-image]][tag-url]

The official Smartcar JavaScript SDK.

## Overview

The [Smartcar API](https://smartcar.com/docs) lets you read vehicle data
(location, odometer) and send commands to vehicles (lock, unlock) using HTTP requests.

To make requests to a vehicle from a web application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar JavaScript SDK provides an easy way to launch and handle the authorization flow to retrieve the resulting `code`.

Before integrating with the JavaScript SDK, you'll need to register an application in the [Smartcar dashboard](https://dashboard.smartcar.com). Once you are registered, you will have a Client ID and Client Secret which will allow you to authorize users.

## Installation

You can install the JavaScript SDK using either npm or through our CDN.

### npm

```shell
npm install <PACKAGE>
```

### Smartcar CDN

```html
<script src="https://javascript-sdk.smartcar.com/sdk-2.0.0.js"></script>
```

## SDK Reference

For detailed documentation on parameters and available methods, please refer to
the [SDK Reference](doc/).

## Flow

The SDK manages the frontend flow of the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1). The steps are as follows:

<p align="center"><img src="doc/architecture.svg"/></p>

1. User clicks "Connect your car" button (or similar button) on your application's frontend.
2. User sees a pop-up dialog with the Smartcar authorization flow.
   1. The user will select the make of their vehicle.
   2. User will be prompted to login with their vehicle credentials.
   3. User will be presented with the set of requested permissions to grant your application.
   4. User will either "Allow" or "Deny" access to your application.
3. The Smartcar authorization flow will redirect the user to the Smartcar JavaScript SDK redirect page along with the resulting `code`. The page will then send the `code` to your application's window and close the pop-up dialog.
4. Your JavaScript frontend will recieve the `code` in a callback function.
5. Your application's backend server will need to accept the `code` and exchange it for an access token.

The SDK facilitates generating OAuth links, creating pop-up dialogs, and recieving authorization codes. This SDK will not assist in exchanging authorization codes for an access token or making requests to vehicles. Please see our [Backend SDKs](https://smartcar.com/docs#backend-sdks) for more on handling the access tokens and vehicle requests.

## Quick Start

### 1. Register a JavaScript SDK Redirect URI

The JavaScript SDK uses a special redirect URI to provide a simpler flow to retrieve authorization codes. The redirect uri takes the following form:

```
https://javascript-sdk.smartcar.com/redirect-2.0.0?app_origin=<Your Application's Origin>
```

The `app_origin` should be the location of where your website is located. The origin consists of just the protocol and host of your site without the resource path. Some example origins:

#### Valid:
+ `https://example.com`
+ `https://myapp.example.com`
+ `http://localhost:8000`

#### Invalid:
+ `https://example.com/some/path`
+ `http://localhost:8000/some/path`
+ `http://localhost:8000?foo=bar#baz`

Once you have constructed your redirect uri, make sure to register it on the [Smartcar dashboard](https://dashboard.smartcar.com).

### 2. Initialize Smartcar

```javascript
const smartcar = new Smartcar({
  clientId: '<your-client-id>',
  redirectUri: '<your-redirect-uri>',
  scope: ['read_vehicle_info', 'read_odometer'],
  onComplete: function(err, code) {
    if (err) {
      // handle errors from the authorization flow (i.e. user denies access)
    }
    // handle the returned code by sending it to your backend server
    sendToBackend(code);
  },
});
```

Reference: **TODO - LINK TO METHOD REFERENCE**

> NOTE: See the full set of available scopes in the [Smartcar API Reference](https://smartcar.com/docs#get-all-vehicles) under "Required Permissions" for each endpoint.

### 3. Launch the authorization flow

Add a click handler to an HTML element:

```javascript
smartcar.addClickHandler({id: '#your-button-id'});
```

Reference: **TODO - LINK TO METHOD REFERENCE**

Alternatively, you can launch the authorization flow directly:

```javascript
smartcar.openDialog();
```

Reference: **TODO - LINK TO METHOD REFERENCE**

## Advanced

The JavaScript SDK also can be used in alternative flows than the one described above. This section will cover some of its other usages.

### Authorization URI Generation

**TODO: LINK METHODS BELOW TO REFERENCE**

Normally the `.addClickHandler` and `.openDialog` methods are used to launch the authorization flow. However, if you would like to generate the OAuth authorization URL directly you can do so with the `.getAuthUrl()` method.

```javascript
const url = smartcar.getAuthURL();
```

Reference: **TODO: LINK TO METHOD REFERENCE**

### Server side redirect handling

In a traditional OAuth implementation, the redirect uri is normally set to your application's server backend, rather than the JavaScript SDK redirect page used by this SDK. In this architecture you would recieve the authorization code on a backend route instead of the client-side `onComplete` callback.

To use the JavaScript SDK for this flow:

1. Set the `redirect_uri` parameter in the initialization to a route on your application's backend server:

```javascript
const smartcar = new Smartcar({
  clientId: '<your-client-id>',
  redirectUri: '<your-backend-redirect-uri>',
  scope: ['read_vehicle_info', 'read_odometer'],
  onComplete: function() {},
});
```

Make sure to also register the uri on the [Smartcar dashboard](https://dashboard.smartcar.com).

2. On your `redirect_uri` route, you will need to accept the authorization code according to the query parameters documented in the [Smartcar API Reference](https://smartcar.com/docs#3-handle-smartcar-response).

For example:

```
https://application-backend.com/page?code=90abecb6-e7ab-4b85-864a-e1c8bf67f2ad
```

Or in case of an error:

```
https://application-backend.com/page?error=access_denied&error_description=User+denied+access+to+application.
```

3. On the redirect route, you can render a page with the JavaScript SDK's redirect helper script. The script will invoke the `onComplete` callback and close out the authorization pop-up dialog.

```html
<script src="https://javascript-sdk.smartcar.com/redirect-2.0.0.js"></script>
```

> NOTE: If the page serving the redirect script file does not have the original query parameters sent from the Smartcar authorization flow (`code`, `state`, `error`, `error_description`), then the `onComplete` callback will be invoked with no parameters.


[ci-url]: https://travis-ci.com/smartcar/javascript-sdk
[ci-image]: https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master
[tag-url]: https://github.com/smartcar/javascript-sdk/tags
[tag-image]: https://img.shields.io/github/tag/smartcar/javascript-sdk.svg
