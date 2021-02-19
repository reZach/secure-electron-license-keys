import arg from "arg";

const crypto = require("crypto");

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg({
    "--secret": String,
    "-s": "--secret"
  });
  return {
    secret: args["--secret"] || ""
  };
}

export function cli(args) {
  const options = parseArgumentsIntoOptions(args);
  console.log(options);
  const {
    publicKey,
    privateKey
  } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: ""
    }
  });
  let encrypted = crypto.privateEncrypt(privateKey, Buffer.from(JSON.stringify({
    a: 2
  })));
  let decrypted = crypto.publicDecrypt(publicKey, encrypted);
  console.log(decrypted);
} // https://www.sohamkamani.com/nodejs/rsa-encryption/
// https://medium.com/jspoint/creating-cli-executable-global-npm-module-5ef734febe32
// https://www.twilio.com/blog/how-to-build-a-cli-with-node-js
// https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
// https://build-system.fman.io/generating-license-keys
// https://build-system.fman.io/manual/#license-keys
// function sign(args){
//     console.log(args);
// }
// module.exports = sign;