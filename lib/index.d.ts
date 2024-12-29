export const validateLicenseRequest: "ValidateLicense-Request";
export const validateLicenseResponse: "ValidateLicense-Response";
export function preloadBindings(ipcRenderer: any): {
    send: (channel: any) => void;
    onReceive: (channel: any, func: any) => void;
    clearRendererBindings: () => void;
};
export function mainBindings(ipcMain: any, browserWindow: any, fs: any, crypto: any, options: any): void;
export function clearMainBindings(ipcMain: any): void;
export default SecureElectronLicenseKeys;
declare class SecureElectronLicenseKeys {
}
