import arg from "arg";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        "--major": String,
        "--minor": String,
        "--expire": String,
        "--public": String,
        "--private": String,
        "--license": String,
        "--output": String,
        "-ma": "--major",
        "-mi": "--minor",
        "-e": "--expire",
        "-pu": "--public",
        "-pr": "--private",
        "-l": "--license",
        "-o": "--output"
    }, {
        permissive: false,
        argv: rawArgs.slice(2),
        stopAtPositional: false
    });
    return {
        major: args["--major"] || "all",
        minor: args["--minor"] || "all",
        expire: args["--expire"] || "",
        public: args["--public"] || "public.key",
        private: args["--private"] || "private.key",
        license: args["--license"] || "license.data",
        output: args["--output"] || process.cwd()
    };
}

const cryptoKeyPairOptions = {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: "spki",
        format: "pem"
    },
    privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
    }
};

export function cli(args) {
    const options = parseArgumentsIntoOptions(args);
    
    // Define user license options/values
    let userData = {
        major: options.major,
        minor: options.minor,
        expire: options.expire
    };

    // Generate a public/private keypair
    const {
        publicKey,
        privateKey
    } = crypto.generateKeyPairSync("rsa", cryptoKeyPairOptions);

    // Sign user data with the private key
    const encrypted = crypto.privateEncrypt(privateKey, Buffer.from(JSON.stringify(userData)));

    // Save license data, along with public/private keys
    const publicKeyFilePath = path.join(options.output, options.public);
    const privateKeyFilePath = path.join(options.output, options.private);
    const licenseFilePath = path.join(options.output, options.license);

    console.log(`Saving public key file to '${publicKeyFilePath}'.`);
    fs.writeFileSync(publicKeyFilePath, publicKey);

    console.log(`Saving private key file to '${privateKeyFilePath}'.`);
    fs.writeFileSync(privateKeyFilePath, privateKey);

    console.log(`Saving license file to '${licenseFilePath}'.`);
    fs.writeFileSync(licenseFilePath, encrypted);
}

const validate = function(options) {    
    let validationResult = {
        _success: false
    };
    
    // Retrieve public key and license data
    const publicKey = fs.readFileSync(path.join(process.cwd(), "public.key"));
    const licenseData = fs.readFileSync(path.join(process.cwd(), "license.data"));

    // Attempt to read license data with the public key    
    try {
        const decrypted = crypto.publicDecrypt(publicKey, licenseData);

        Object.assign(validationResult, JSON.parse(decrypted.toString("utf8")));
        validationResult._success = true;
    } catch (error) {
        console.error(error);
    }

    return validationResult;
}

export default validate;