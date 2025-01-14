import files from 'examples/files';

const href = window.top?.location.href ?? '';
const params = getQueryParams(href);
const url = new URL(href);
const root = url.pathname.replace(/\/([^/]+\.html)?$/g, '');

/**
 * @type {string}
 */
export const rootPath = root.replace(/\/iframe/g, '');

/**
 * @param {string} url - The URL specified.
 * @returns {Record<string, string>} - The object of query parameters
 */
export function getQueryParams(url) {
    return Object.fromEntries(url
        .split('?').pop()
        .split('#')[0]
        .split('&').map(s => s.split('=')));
}

/**
 * @param {string} url - The URL of the file.
 * @returns {Promise<string>} - The contents of the file.
 */
export async function fetchFile(url) {
    const res = await fetch(url);
    return res.text();
}

/**
 * @param {string} url - The URL to ES5 file.
 * @returns {Promise<Object>} - The module exports.
 *
 * @example
 * const CORE = await loadES5('https://cdn.jsdelivr.net/npm/@loaders.gl/core@2.3.6/dist/dist.min.js');
 * const DRACO = await loadES5('https://cdn.jsdelivr.net/npm/@loaders.gl/draco@2.3.6/dist/dist.min.js');
 */
export async function loadES5(url) {
    const txt = await fetchFile(url);
    const module = {
        exports: {}
    };
    // eslint-disable-next-line no-new-func
    return (Function('module', 'exports', txt).call(module, module, module.exports), module).exports;
}

/**
 * @type {string[]}
 */
const blobUrls = [];

/**
 * Imports a local file as a module.
 *
 * @param {string} name - The name of the local file.
 * @returns {Promise<any>} - The module exports.
 */
export function localImport(name) {
    if (!/\.mjs$/.test(name)) {
        throw new Error(`Invalid module: ${name}`);
    }
    const blob = new Blob([files[name]], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    return import(url);
}

/**
 * Clears all the blob URLs.
 */
export function clearImports() {
    blobUrls.forEach(URL.revokeObjectURL);
}

/**
 * @param {string} script - The script to parse.
 * @returns {Record<string, any>} - The parsed config.
 */
export function parseConfig(script) {
    const regex = /\/\/ @config ([^ \n]+) ?([^\n]+)?/g;
    let match;
    /** @type {Record<string, any>} */
    const config = {};
    while ((match = regex.exec(script)) !== null) {
        const key = match[1].trim();
        const val = match[2]?.trim();
        config[key] = /true|false/g.test(val) ? val === 'true' : val ?? true;
    }
    return config;
}

const DEVICE_TYPES = ['webgpu', 'webgl2', 'webgl1'];

/**
 * @param {any} config - The configuration object.
 * @returns {string} - The device type.
 */
function getDeviceType(config) {
    if (params.deviceType && DEVICE_TYPES.includes(params.deviceType)) {
        console.warn("Overwriting default deviceType from URL: ", params.deviceType);
        return params.deviceType;
    }

    const selectedDevice = localStorage.getItem('preferredGraphicsDevice') ?? 'webgl2';

    switch (selectedDevice) {
        case 'webgpu':
            if (config.WEBGPU_DISABLED) {
                console.warn('Picked WebGPU but example is not supported on WebGPU, defaulting to WebGL2');
                return 'webgl2';
            }
            break;
        case 'webgl2':
            if (config.WEBGL_DISABLED) {
                console.warn('Picked WebGL2 but example is not supported on WebGL, defaulting to WebGPU');
                return 'webgpu';
            }
            break;
        case 'webgl1':
            if (config.WEBGL_DISABLED) {
                console.warn('Picked WebGL1 but example is not supported on WebGL, defaulting to WebGPU');
                return 'webgpu';
            }

            if (config.WEBGL1_DISABLED) {
                console.warn('Picked WebGL1 but example is not supported on WebGL1, defaulting to WebGL2');
                return 'webgl2';
            }
            break;
    }

    return selectedDevice;
}

export let deviceType = 'webgl2';

/**
 * @param {Record<string, any>} config - The configuration object.
 */
export function updateDeviceType(config) {
    deviceType = getDeviceType(config);
}

/**
 * @param {string} eventName - The name of the fired event.
 * @param {object} detail - The detail object.
 */
export function fire(eventName, detail = {}) {
    window.top?.dispatchEvent(new CustomEvent(eventName, { detail }));
}
