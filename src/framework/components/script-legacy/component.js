import { Debug } from '../../../core/debug.js';
import { path } from '../../../core/path.js';

import { Component } from '../component.js';

class ScriptLegacyComponent extends Component {
    constructor(system, entity) {
        super(system, entity);
        this.on('set_scripts', this.onSetScripts, this);
    }

    send(name, functionName) {
        Debug.deprecated('ScriptLegacyComponent.send() is deprecated and will be removed soon. Please use: https://developer.playcanvas.com/user-manual/scripting/communication/');

        const args = Array.prototype.slice.call(arguments, 2);
        const instances = this.entity.script.instances;
        let fn;

        if (instances && instances[name]) {
            fn = instances[name].instance[functionName];
            if (fn) {
                return fn.apply(instances[name].instance, args);
            }
        }
        return undefined;
    }

    onEnable() {
        // if the scripts of the component have been loaded
        // then call the appropriate methods on the component
        if (this.data.areScriptsLoaded && !this.system.preloading) {
            if (!this.data.initialized) {
                this.system._initializeScriptComponent(this);
            } else {
                this.system._enableScriptComponent(this);
            }

            if (!this.data.postInitialized) {
                this.system._postInitializeScriptComponent(this);
            }
        }
    }

    onDisable() {
        this.system._disableScriptComponent(this);
    }

    onSetScripts(name, oldValue, newValue) {
        if (!this.system._inTools || this.runInTools) {
            // if we only need to update script attributes then update them and return
            if (this._updateScriptAttributes(oldValue, newValue)) {
                return;
            }

            // disable the script first
            if (this.enabled) {
                this.system._disableScriptComponent(this);
            }

            this.system._destroyScriptComponent(this);

            this.data.areScriptsLoaded = false;

            // get the urls
            const scripts = newValue;
            const urls = scripts.map((s) => {
                return s.url;
            });

            // try to load the scripts synchronously first
            if (this._loadFromCache(urls)) {
                return;
            }

            // not all scripts are in the cache so load them asynchronously
            this._loadScripts(urls);
        }
    }

    // Check if only script attributes need updating in which
    // case just update the attributes and return otherwise return false
    _updateScriptAttributes(oldValue, newValue) {
        let onlyUpdateAttributes = true;

        if (oldValue.length !== newValue.length) {
            onlyUpdateAttributes = false;
        } else {
            for (let i = 0, len = newValue.length; i < len; i++) {
                if (oldValue[i].url !== newValue[i].url) {
                    onlyUpdateAttributes = false;
                    break;
                }
            }
        }

        if (onlyUpdateAttributes) {
            for (const key in this.instances) {
                if (this.instances.hasOwnProperty(key)) {
                    this.system._updateAccessors(this.entity, this.instances[key]);
                }
            }
        }

        return onlyUpdateAttributes;
    }

    // Load each url from the cache synchronously. If one of the urls is not in the cache
    // then stop and return false.
    _loadFromCache(urls) {
        const cached = [];

        const prefix = this.system.app._scriptPrefix || '';
        const regex = /^https?:\/\//i;

        for (let i = 0, len = urls.length; i < len; i++) {
            let url = urls[i];
            if (!regex.test(url)) {
                url = path.join(prefix, url);
            }

            const type = this.system.app.loader.getFromCache(url, 'script');

            // if we cannot find the script in the cache then return and load
            // all scripts with the resource loader
            if (!type) {
                return false;
            }

            cached.push(type);
        }

        for (let i = 0, len = cached.length; i < len; i++) {
            const ScriptType = cached[i];

            // check if this is a regular JS file
            if (ScriptType === true) {
                continue;
            }

            // ScriptType may be null if the script component is loading an ordinary JavaScript lib rather than a PlayCanvas script
            // Make sure that script component hasn't been removed since we started loading
            if (ScriptType && this.entity.script) {
                // Make sure that we haven't already instantiated another identical script while loading
                // e.g. if you do addComponent, removeComponent, addComponent, in quick succession
                if (!this.entity.script.instances[ScriptType._pcScriptName]) {
                    const instance = new ScriptType(this.entity);
                    this.system._preRegisterInstance(this.entity, urls[i], ScriptType._pcScriptName, instance);
                }
            }
        }

        if (this.data) {
            this.data.areScriptsLoaded = true;
        }

        // We only need to initialize after preloading is complete
        // During preloading all scripts are initialized after everything is loaded
        if (!this.system.preloading) {
            this.system.onInitialize(this.entity);
            this.system.onPostInitialize(this.entity);
        }

        return true;
    }

    _loadScripts(urls) {
        let count = urls.length;

        const prefix = this.system.app._scriptPrefix || '';

        urls.forEach((url) => {
            let _url = null;
            let _unprefixed = null;
            // support absolute URLs (for now)
            if (url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://')) {
                _unprefixed = url;
                _url = url;
            } else {
                _unprefixed = url;
                _url = path.join(prefix, url);
            }
            this.system.app.loader.load(_url, 'script', (err, ScriptType) => {
                count--;
                if (!err) {
                    // ScriptType is null if the script is not a PlayCanvas script
                    if (ScriptType && this.entity.script) {
                        if (!this.entity.script.instances[ScriptType._pcScriptName]) {
                            const instance = new ScriptType(this.entity);
                            this.system._preRegisterInstance(this.entity, _unprefixed, ScriptType._pcScriptName, instance);
                        }
                    }
                } else {
                    console.error(err);
                }
                if (count === 0) {
                    this.data.areScriptsLoaded = true;

                    // We only need to initialize after preloading is complete
                    // During preloading all scripts are initialized after everything is loaded
                    if (!this.system.preloading) {
                        this.system.onInitialize(this.entity);
                        this.system.onPostInitialize(this.entity);
                    }
                }
            });
        });
    }
}

export { ScriptLegacyComponent };
