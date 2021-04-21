const path = require("path");

export const validateLicenseRequest = "ValidateLicense-Request";
export const validateLicenseResponse = "ValidateLicense-Response";

const parseVersion = function (version) {

    // Return early if not a valid semver (x.y.z)
    if (!version || version.length < 5) {
        console.warn(`Could not parse version since ${version} doesn't seem to follow semver specifications.`)
        return version;
    }

    const split = version.split(".");
    if (split.length === 3){
        return {
            major: split[0],
            minor: split[1],
            patch: split[2]
        }
    } else {
        return version;
    }
}

const validate = function (fs, crypto, options) {
    let validationResult = {
        success: false,
        appVersion: parseVersion(options.version)
    };

    // Retrieve public key and license data
    const publicKey = fs.readFileSync(path.join(options.root, "public.key"));
    const licenseData = fs.readFileSync(path.join(options.root, "license.data"));

    // Attempt to read license data with the public key    
    try {
        const decrypted = crypto.publicDecrypt(publicKey, licenseData);

        Object.assign(validationResult, JSON.parse(decrypted.toString("utf8")));
        validationResult.success = true;
    } catch (error) {
        console.error(error);
    }

    return validationResult;
}

// This is the code that will go into the preload.js file
export const preloadBindings = function (ipcRenderer) {
    return {
        send: (channel) => {
            const validChannels = [validateLicenseRequest];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel);
            }
        },
        onReceive: (channel, func) => {
            const validChannels = [validateLicenseResponse];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes "sender"
                ipcRenderer.on(channel, (event, args) => func(args));
            }
        },
        clearRendererBindings: () => {
            ipcRenderer.removeAllListeners(validateLicenseResponse);
        }
    };
};

// This is the code that will go into the main.js file
// in order to set up the ipc main bindings
export const mainBindings = function (ipcMain, browserWindow, fs, crypto, options) {
    if (!options) {
        throw "options must be defined in order for license key validation to work!";
    } else if (typeof options.root === "undefined") {
        throw "options must contain a value for 'root'. We suggest 'process.cwd()'.";
    } else if (typeof options.version === "undefined") {
        console.warn("By not passing a 'version' property, the client side code will not be able to make determinations based on this value. We suggest 'app.getVersion()'.");
    }

    ipcMain.on(validateLicenseRequest, (IpcMainEvent, args) => {
        const result = validate(fs, crypto, options);

        browserWindow.webContents.send(validateLicenseResponse, result);
    });
};

// Clears the bindings from ipcMain;
// in case app is closed/reopened (only on macos)
export const clearMainBindings = function (ipcMain) {
    ipcMain.removeAllListeners(validateLicenseRequest);
}

class SecureElectronLicenseKeys {
    constructor() {

    }
}

export default SecureElectronLicenseKeys;