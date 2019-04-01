# Smartcar JavaScript SDK

Smartcar JavaScript SDK documentation.


## Classes

<dl>
<dt><a href="#Smartcar">Smartcar</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#OnComplete">OnComplete</a> : <code>function</code></dt>
<dd></dd>
</dl>

<a name="Smartcar"></a>

## Smartcar
**Kind**: global class

* [Smartcar](#Smartcar)
    * [new Smartcar(options)](#new_Smartcar_new)
    * _instance_
        * [.getAuthUrl(options)](#Smartcar+getAuthUrl) ⇒ <code>String</code>
        * [.openDialog(options)](#Smartcar+openDialog)
        * [.addClickHandler(options)](#Smartcar+addClickHandler)
    * _static_
        * [.AccessDenied](#Smartcar.AccessDenied) ⇐ <code>Error</code>
            * [new Smartcar.AccessDenied(message)](#new_Smartcar.AccessDenied_new)

<a name="new_Smartcar_new"></a>

### new Smartcar(options)
Initializes Smartcar class.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | the SDK configuration object |
| options.clientId | <code>String</code> |  | the application's client id |
| options.redirectUri | <code>String</code> |  | the registered redirect uri of the application |
| [options.scope] | <code>Array.&lt;String&gt;</code> |  | requested permission scopes |
| [options.onComplete] | [<code>OnComplete</code>](#OnComplete) |  | called on completion of auth flow |
| [options.testMode] | <code>Boolean</code> | <code>false</code> | launch the Smartcar auth flow in test mode |

<a name="Smartcar+getAuthUrl"></a>

### smartcar.getAuthUrl(options) ⇒ <code>String</code>
Generates Smartcar OAuth URL.

**Kind**: instance method of [<code>Smartcar</code>](#Smartcar)
**Returns**: <code>String</code> - OAuth authorization URL to redirect user to.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | the link configuration object |
| [options.state] | <code>String</code> |  | arbitrary state passed to redirect uri |
| [options.forcePrompt] | <code>Boolean</code> | <code>false</code> | force permission approval screen to show on every authentication, even if the user has previously consented to the exact scope of permission |
| [options.vehicleInfo.make] | <code>Object</code> \| <code>string</code> |  | `vehicleInfo` is an object with an optional property `make`, which allows users to bypass the car brand selection screen. For a complete list of supported makes, please see our [API Reference](https://smartcar.com/docs/api#authorization) documentation. |

**Example**
```js
https://connect.smartcar.com/oauth/authorize?
response_type=code
&client_id=8229df9f-91a0-4ff0-a1ae-a1f38ee24d07
&scope=read_odometer read_vehicle_info
&redirect_uri=https://example.com/home
&state=0facda3319
&make=TESLA
```
<a name="Smartcar+openDialog"></a>

### smartcar.openDialog(options)
Launches the OAuth dialog flow.

**Kind**: instance method of [<code>Smartcar</code>](#Smartcar)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | the link configuration object |
| [options.state] | <code>String</code> |  | arbitrary parameter passed to redirect uri |
| [options.forcePrompt] | <code>Boolean</code> | <code>false</code> | force permission approval screen to show on every authentication, even if the user has previously consented to the exact scope of permission |

<a name="Smartcar+addClickHandler"></a>

### smartcar.addClickHandler(options)
Adds an on-click event listener to the element with the provided id.

On-click event calls openDialog when the specified element is clicked.

**Kind**: instance method of [<code>Smartcar</code>](#Smartcar)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | clickHandler configuration object |
| options.id | <code>String</code> | id of the element to add click handler to |
| [options.state] | <code>String</code> | arbitrary parameter passed to redirect uri |
| [options.forcePrompt] | <code>Boolean</code> | force permission approval screen to show on every authentication, even if the user has previously consented to the exact scope of permission |

<a name="Smartcar.AccessDenied"></a>

### Smartcar.AccessDenied ⇐ <code>Error</code>
Access denied error returned by authorization flow.

**Kind**: static class of [<code>Smartcar</code>](#Smartcar)
**Extends**: <code>Error</code>
<a name="new_Smartcar.AccessDenied_new"></a>

#### new Smartcar.AccessDenied(message)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>String</code> | detailed error description |

<a name="OnComplete"></a>

## OnComplete : <code>function</code>
**Kind**: global typedef

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | something went wrong in the authorization flow; this normally indicates that the user denied access to your application or does not have a connected vehicle |
| code | <code>String</code> | the authorization code to be exchanged from a backend sever for an access token |
| [state] | <code>Object</code> | contains state if it was set on the initial authorization request |

