# secure-electron-license-keys

A secure way to implement offline license key validation in electron apps.

> This process is already set up in the [secure-electron-template](https://github.com/reZach/secure-electron-template)!

## Overview

License key validation with this package works like this:

1. License keys are generated with [secure-electron-license-keys-cli](https://github.com/reZach/secure-electron-license-keys-cli). With this CLI tool you define under what conditions (ie. major/minor version, user identifier, etc.) the license should be valid for.
2. These license keys (`public.key` and `license.data`) are placed in the _root_ of your Electron app.
3. Bindings are added in `main.js` and `preload.js`.
4. The client/frontend page sets up a `window.api.licenseKeys.onReceive(validateLicenseResponse, function(data) {});` function listener.
5. The client/frontend page makes a request: `window.api.licenseKeys.send(validateLicenseRequest);`.
6. The `onReceive` listener receives back a response and your client/frontend page can read whether or not the license key is valid and act accordingly.

## Setup

**main.js**

```js
const {
    app,
    BrowserWindow,
    ipcMain,
} = require("electron");
const SecureElectronLicenseKeys = require("secure-electron-license-keys");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

async function createWindow() {

    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "App title",
        webPreferences: {
            preload: path.join(
                __dirname,
                "preload.js"
            )
        },
    });

    // Setup bindings for offline license verification
    SecureElectronLicenseKeys.mainBindings(ipcMain, win, fs, crypto, {
        root: process.cwd(),
        version: app.getVersion(),
    });

    // Load app
    win.loadURL("index.html");

    // Emitted when the window is closed.
    win.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    } else {
        SecureElectronLicenseKeys.clearMainBindings(ipcMain);
    }
});
```

**preload.js**
```js
const {
    contextBridge,
    ipcRenderer
} = require("electron");
const SecureElectronLicenseKeys = require("secure-electron-license-keys");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
    licenseKeys: SecureElectronLicenseKeys.preloadBindings(ipcRenderer)
});
```

**Sample front-end code**
```jsx
import console from "node:console";
import React from "react";
import {
  validateLicenseRequest,
  validateLicenseResponse,
} from "secure-electron-license-keys";

class Component extends React.Component {
  constructor(props) {
    super(props);

    this.checkLicense = this.checkLicense.bind(this);
  }

  componentWillUnmount() {
    window.api.licenseKeys.clearRendererBindings();
  }

  componentDidMount() {
    // Set up binding to listen when the license key is
    // validated by the main process
    const _ = this;

    window.api.licenseKeys.onReceive(validateLicenseResponse, function (data) {
      console.log("License response:");
      console.log(data);
    });
  }

  // Fire event to check the validity of our license
  checkLicense(event) {
    window.api.licenseKeys.send(validateLicenseRequest);
  }

  render() {
    return (
      <div>
        <button onClick={this.checkLicense}>Check license</button>
      </div>
    );
  }
}

export default Component;
```

## Response
When your client page receives a response (ie in the `window.api.licenseKeys.onReceive` call), the payload returned has these properties:

|Property name|Type|Description|
|---|---|---|
|success|bool|If license validation was successful|
|appVersion|object or string|The value of `package.json` in your app. Contains the properties `major`, `minor` and `patch` (all are strings). If the value passed into the **main.js** binding does not follow [semver](https://semver.org/) specification, the value returned in `appVersion` will be a string|
|major|string|The major value set when generating the license key|
|minor|string|The minor value set when generating the license key|
|patch|string|The patch value set when generating the license key|
|user|string|The user value set when generating the license key|
|expire|string|The expire value set when generating the license key|

**Note** - the values contained within this response will be default values if you did not set them when generating the license keys. Please see [here](https://github.com/reZach/secure-electron-license-keys-cli#options) for more details on setting values when generating license keys.