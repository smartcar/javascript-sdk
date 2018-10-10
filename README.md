# Smartcar JS Client SDK [![Build Status][ci-image]][ci-url] [![GitHub tag][tag-image]][tag-url]

The official Smartcar JavaScript SDK.

## Overview

The [Smartcar API](https://smartcar.com/docs) lets you read vehicle data
(location, odometer) and send commands to vehicles (lock, unlock) using HTTP requests.

To make requests to a vehicle from a web application, the end user must connect their vehicle using [Smartcar's authorization flow](https://smartcar.com/docs#authentication). The Smartcar JavaScript SDK provides an easy way to launch and handle the authorization flow to retrieve the resulting `code`.

## SDK Reference

For detailed documentation on parameters and available methods, please refer to
the [SDK Reference](doc/README.md).

## Installation

### npm

```shell
npm install <PACKAGE>
```

### Smartcar CDN

```html
<script src="https://javascript-sdk.smartcar.com/sdk-<VERSION>.js"></script>
```

## Quick Start

Before integrating with the JavaScript SDK, you'll need to register an application in the [Smartcar dashboard](https://dashboard.smartcar.com). Once you are registered, you will have a Client ID and Client Secret which will allow you to authorize users.

The SDK manages the frontend flow of the [OAuth authorization process](https://tools.ietf.org/html/rfc6749#section-4.1). The steps are as follows:

1. User clicks "Connect your car" button (or similar button) on your application's frontend.
2. User sees a pop-up dialog with the first page of the Smartcar authorization flow. The user will select the make of their vehicle.
3. User will be prompted to login with their vehicle credentials.
4. User will be presented with the set of requested permissions to grant your application.
5. User will either "Allow" or "Deny" access to your application.
6. The Smartcar authorization flow will redirect the user to the Smartcar JavaScript SDK redirect page along with the resulting `code`. The page will then send the `code` to your application's window and close the pop-up dialog.
7. Your JavaScript frontend will recieve the `code` in a callback function.
8. Your application's backend server will need to accept the `code` and exchange it for an access token. 

The SDK facilitates generating OAuth links, creating pop-up dialogs, and recieving authorization codes. This SDK will not assist in exchanging authorization codes for an access token or making requests to vehicles. Please see our [Backend SDKs](https://smartcar.com/docs#backend-sdks) for more on handling the access tokens and vehicle requests.

## Usage

### 1. Register a JavaScript SDK Redirect URI

The JavaScript SDK uses a special redirect URI to provide a simpler flow to retrieve authorization codes. The redirect uri takes the following form:

```
https://javascript-sdk.smartcar.com/redirect-<VERSION>?app_origin=<Your Application's Origin>
```

The `app_origin` should be the location of where your website is located. The origin consists of just the protocol and hostname of your site without the resource path. Some example origins:

#### Valid:
+ `https://example.com`
+ `https://myapp.example.com`
+ `http://localhost:8000`

#### Invalid:
+ `https://example.com/some/path`
+ `http://localhost:8000/some/path`

Once you have constructed your redirect uri, make sure to register it on the [Smartcar dashboard](https://dashboard.smartcar.com).

### 2. Initialize Smartcar

```javascript
const smartcar = new Smartcar({
  clientId: '<your-client-id>',
  redirectUri: '<your-redirect-uri>',
  scope: ['read_vehicle_info', 'read_odometer'],
  onComplete: function(error, code) {
    // handle the returned code by sending it to your backend server
    sendToBackend(code);
  },
});
```

> NOTE: See the full set of available scopes under "Required Permissions" for each endpoint in the [Smartcar API Reference](https://smartcar.com/docs#get-all-vehicles).

### 3. Launch the authorization flow

Add a click handler to an HTML element:

```javascript
smartcar.addClickHandler({id: '#your-button-id'});
```

Alternatively, you can launch the authorization fow directly:

```javascript
smartcar.openDialog();
```

## Advanced

TODO: WRITE STUFF HERE

[ci-image]: https://travis-ci.com/smartcar/javascript-sdk.svg?token=jMbuVtXPGeJMPdsn7RQ5&branch=master
[tag-url]: https://github.com/smartcar/javascript-sdk/tags
[tag-image]: https://img.shields.io/github/tag/smartcar/javascript-sdk.svg
