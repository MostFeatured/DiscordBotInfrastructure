"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBI = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const ChatInput_1 = require("./types/ChatInput/ChatInput");
const ChatInputOptions_1 = require("./types/ChatInput/ChatInputOptions");
const publishInteractions_1 = require("./methods/publishInteractions");
const Event_1 = require("./types/Event");
const MemoryStore_1 = require("./utils/MemoryStore");
const hookInteractionListeners_1 = require("./methods/hookInteractionListeners");
const Events_1 = require("./Events");
const Locale_1 = require("./types/other/Locale");
const Button_1 = require("./types/Components/Button");
const StringSelectMenu_1 = require("./types/Components/StringSelectMenu");
const MessageContextMenu_1 = require("./types/other/MessageContextMenu");
const UserContextMenu_1 = require("./types/other/UserContextMenu");
const hookEventListeners_1 = require("./methods/hookEventListeners");
const eventMap_json_1 = tslib_1.__importDefault(require("./data/eventMap.json"));
const Modal_1 = require("./types/Components/Modal");
const Sharding = tslib_1.__importStar(require("discord-hybrid-sharding"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const InteractionLocale_1 = require("./types/other/InteractionLocale");
const CustomEvent_1 = require("./types/other/CustomEvent");
const async_and_quick_1 = tslib_1.__importDefault(require("async-and-quick"));
const UserSelectMenu_1 = require("./types/Components/UserSelectMenu");
const MentionableSelectMenu_1 = require("./types/Components/MentionableSelectMenu");
const ChannelSelectMenu_1 = require("./types/Components/ChannelSelectMenu");
const RoleSelectMenu_1 = require("./types/Components/RoleSelectMenu");
class DBI {
    namespace;
    config;
    data;
    events;
    cluster;
    _loaded;
    _hooked;
    constructor(namespace, config) {
        this.namespace = namespace;
        const self = this;
        config.store = config.store || new MemoryStore_1.MemoryStore();
        config.defaults = {
            locale: "en",
            defaultMemberPermissions: [],
            directMessages: false,
            ...(config.defaults || {})
        };
        config.sharding = config.sharding ?? "off";
        config.strict = config.strict ?? true;
        config.references = {
            autoClear: undefined,
            ...(config.references || {})
        };
        // @ts-ignore
        this.config = config;
        this.data = {
            interactions: new discord_js_1.default.Collection(),
            events: new discord_js_1.default.Collection(),
            locales: new discord_js_1.default.Collection(),
            interactionLocales: new discord_js_1.default.Collection(),
            other: config.data?.other ?? {},
            eventMap: { ...eventMap_json_1.default },
            customEventNames: new Set(),
            unloaders: new Set(),
            registers: new Set(),
            registerUnloaders: new Set(),
            refs: config.data?.refs ?? new Map(),
            clients: Object.assign([], {
                next(key = "global") {
                    this.indexes[key] = (((this.indexes[key] ?? -1) + 1) % this.length);
                    return this[this.indexes[key]];
                },
                random(size) {
                    if (typeof size === "number") {
                        return this.sort(() => Math.random() - 0.5).slice(0, size);
                    }
                    else {
                        return this[Math.floor(Math.random() * this.length)];
                    }
                },
                first() {
                    return this[0];
                },
                get(namespace) {
                    return this.find((i) => i.namespace === namespace);
                },
                indexes: {}
            })
        };
        this.events = new Events_1.Events(this);
        config.discord = Array.isArray(config.discord) ?
            config.discord :
            [{ token: config.discord.token, options: config.discord.options, namespace: "default" }];
        this.data.clients.push(...config.discord);
        for (let clientContext of this.data.clients) {
            let client = new discord_js_1.default.Client({
                ...(clientContext.options || {}),
                ...(config.sharding == "hybrid" ? {
                    shards: Sharding.getInfo().SHARD_LIST,
                    shardCount: Sharding.getInfo().TOTAL_SHARDS
                } : {})
            });
            clientContext.client = client;
        }
        if (this.data.clients.length === 0)
            throw new Error("No clients provided.");
        if (this.data.clients.length !== 1 && !(config.sharding && config.sharding === "off"))
            throw new Error("Sharding only supports 1 client.");
        this.cluster = config.sharding == "hybrid" ? new Sharding.ClusterClient(this.data.clients[0].client) : undefined;
        this._loaded = false;
        this._hooked = false;
    }
    async _hookListeners() {
        if (this._hooked)
            return;
        this._hooked = true;
        this.data.unloaders.add((0, hookInteractionListeners_1.hookInteractionListeners)(this));
        this.data.unloaders.add((0, hookEventListeners_1.hookEventListeners)(this));
        if (typeof this.config.references.autoClear != "undefined") {
            this.data.unloaders.add((() => {
                let interval = setInterval(() => {
                    this.data.refs.forEach(({ at, ttl }, key) => {
                        if (Date.now() > (at + (ttl || this.config.references.autoClear.ttl))) {
                            this.data.refs.delete(key);
                        }
                    });
                }, this.config.references.autoClear.check);
                return () => {
                    clearInterval(interval);
                };
            })());
        }
    }
    async _unhookListeners() {
        if (!this._hooked)
            return;
        this._hooked = false;
        this.data.unloaders.forEach(f => {
            f();
        });
    }
    async _unregisterAll() {
        for await (const cb of this.data.registerUnloaders) {
            await cb();
        }
        this.data.events.clear();
        this.data.interactions.clear();
        this.data.customEventNames.forEach((value) => {
            delete this.data.eventMap[value];
        });
        this.data.customEventNames.clear();
    }
    async _registerAll() {
        const self = this;
        const ChatInputOptions = new ChatInputOptions_1.DBIChatInputOptions(self);
        for await (const cb of this.data.registers) {
            let ChatInput = function (cfg) {
                let dbiChatInput = new ChatInput_1.DBIChatInput(self, cfg);
                if (self.data.interactions.has(dbiChatInput.name))
                    throw new Error(`DBIChatInput "${dbiChatInput.name}" already loaded as "${self.data.interactions.get(dbiChatInput.name)?.type}"!`);
                self.data.interactions.set(dbiChatInput.name, dbiChatInput);
                return dbiChatInput;
            };
            ChatInput = Object.assign(ChatInput, class {
                constructor(...args) { return ChatInput.apply(this, args); }
            });
            let Event = function (cfg) {
                let dbiEvent = new Event_1.DBIEvent(self, cfg);
                if (self.config.strict && self.data.events.has(dbiEvent.id || dbiEvent.name))
                    throw new Error(`DBIEvent "${dbiEvent.id || dbiEvent.name}" already loaded!`);
                self.data.events.set(dbiEvent.id || dbiEvent.name, dbiEvent);
                return dbiEvent;
            };
            Event = Object.assign(Event, class {
                constructor(...args) { return Event.apply(this, args); }
            });
            let Button = function (cfg) {
                let dbiButton = new Button_1.DBIButton(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiButton.name))
                    throw new Error(`DBIButton "${dbiButton.name}" already loaded as "${self.data.interactions.get(dbiButton.name)?.type}"!`);
                self.data.interactions.set(dbiButton.name, dbiButton);
                return dbiButton;
            };
            Button = Object.assign(Button, class {
                constructor(...args) { return Button.apply(this, args); }
            });
            let StringSelectMenu = function (cfg) {
                let dbiStringSelectMenu = new StringSelectMenu_1.DBIStringSelectMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiStringSelectMenu.name))
                    throw new Error(`DBIStringSelectMenu "${dbiStringSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiStringSelectMenu.name)?.type}"!`);
                self.data.interactions.set(dbiStringSelectMenu.name, dbiStringSelectMenu);
                return dbiStringSelectMenu;
            };
            StringSelectMenu = Object.assign(StringSelectMenu, class {
                constructor(...args) { return StringSelectMenu.apply(this, args); }
            });
            let UserSelectMenu = function (cfg) {
                let dbiUserSelectMenu = new UserSelectMenu_1.DBIUserSelectMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiUserSelectMenu.name))
                    throw new Error(`DBIUserSelectMenu "${dbiUserSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiUserSelectMenu.name)?.type}"!`);
                self.data.interactions.set(dbiUserSelectMenu.name, dbiUserSelectMenu);
                return dbiUserSelectMenu;
            };
            UserSelectMenu = Object.assign(UserSelectMenu, class {
                constructor(...args) { return UserSelectMenu.apply(this, args); }
            });
            let RoleSelectMenu = function (cfg) {
                let dbiRoleSelectMenu = new RoleSelectMenu_1.DBIRoleSelectMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiRoleSelectMenu.name))
                    throw new Error(`DBIRoleSelectMenu "${dbiRoleSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiRoleSelectMenu.name)?.type}"!`);
                self.data.interactions.set(dbiRoleSelectMenu.name, dbiRoleSelectMenu);
                return dbiRoleSelectMenu;
            };
            RoleSelectMenu = Object.assign(RoleSelectMenu, class {
                constructor(...args) { return RoleSelectMenu.apply(this, args); }
            });
            let ChannelSelectMenu = function (cfg) {
                let dbiChannelSelectMenu = new ChannelSelectMenu_1.DBIChannelSelectMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiChannelSelectMenu.name))
                    throw new Error(`DBIChannelSelectMenu "${dbiChannelSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiChannelSelectMenu.name)?.type}"!`);
                self.data.interactions.set(dbiChannelSelectMenu.name, dbiChannelSelectMenu);
                return dbiChannelSelectMenu;
            };
            ChannelSelectMenu = Object.assign(ChannelSelectMenu, class {
                constructor(...args) { return ChannelSelectMenu.apply(this, args); }
            });
            let MentionableSelectMenu = function (cfg) {
                let dbiMentionableSelectMenu = new MentionableSelectMenu_1.DBIMentionableSelectMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiMentionableSelectMenu.name))
                    throw new Error(`DBIMentionableSelectMenu "${dbiMentionableSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiMentionableSelectMenu.name)?.type}"!`);
                self.data.interactions.set(dbiMentionableSelectMenu.name, dbiMentionableSelectMenu);
                return dbiMentionableSelectMenu;
            };
            MentionableSelectMenu = Object.assign(MentionableSelectMenu, class {
                constructor(...args) { return MentionableSelectMenu.apply(this, args); }
            });
            let MessageContextMenu = function (cfg) {
                let dbiMessageContextMenu = new MessageContextMenu_1.DBIMessageContextMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiMessageContextMenu.name))
                    throw new Error(`DBIMessageContextMenu "${dbiMessageContextMenu.name}" already loaded as "${self.data.interactions.get(dbiMessageContextMenu.name)?.type}"!`);
                self.data.interactions.set(dbiMessageContextMenu.name, dbiMessageContextMenu);
                return dbiMessageContextMenu;
            };
            MessageContextMenu = Object.assign(MessageContextMenu, class {
                constructor(...args) { return MessageContextMenu.apply(this, args); }
            });
            let UserContextMenu = function (cfg) {
                let dbiUserContextMenu = new UserContextMenu_1.DBIUserContextMenu(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiUserContextMenu.name))
                    throw new Error(`DBIUserContextMenu "${dbiUserContextMenu.name}" already loaded as "${self.data.interactions.get(dbiUserContextMenu.name)?.type}"!`);
                self.data.interactions.set(dbiUserContextMenu.name, dbiUserContextMenu);
                return dbiUserContextMenu;
            };
            UserContextMenu = Object.assign(UserContextMenu, class {
                constructor(...args) { return UserContextMenu.apply(this, args); }
            });
            let Modal = function (cfg) {
                let dbiModal = new Modal_1.DBIModal(self, cfg);
                if (self.config.strict && self.data.interactions.has(dbiModal.name))
                    throw new Error(`DBIModal "${dbiModal.name}" already loaded as "${self.data.interactions.get(dbiModal.name)?.type}"!`);
                self.data.interactions.set(dbiModal.name, dbiModal);
                return dbiModal;
            };
            Modal = Object.assign(Modal, class {
                constructor(...args) { return Modal.apply(this, args); }
            });
            let Locale = function (cfg) {
                let dbiLocale = new Locale_1.DBILocale(self, cfg);
                if (self.config.strict && self.data.interactionLocales.has(dbiLocale.name))
                    throw new Error(`DBILocale "${dbiLocale.name}" already loaded!`);
                if (self.data.locales.has(dbiLocale.name))
                    dbiLocale.mergeLocale(self.data.locales.get(dbiLocale.name));
                self.data.locales.set(dbiLocale.name, dbiLocale);
                return dbiLocale;
            };
            Locale = Object.assign(Locale, class {
                constructor(...args) { return Locale.apply(this, args); }
            });
            let CustomEvent = function (cfg) {
                let dbiCustomEvent = new CustomEvent_1.DBICustomEvent(self, cfg);
                if (self.config.strict && self.data.eventMap[dbiCustomEvent.name])
                    throw new Error(`DBICustomEvent "${dbiCustomEvent.name}" already loaded!`);
                self.data.eventMap[dbiCustomEvent.name] = dbiCustomEvent.map;
                self.data.customEventNames.add(dbiCustomEvent.name);
                return dbiCustomEvent;
            };
            CustomEvent = Object.assign(CustomEvent, class {
                constructor(...args) { return CustomEvent.apply(this, args); }
            });
            let InteractionLocale = function (cfg) {
                let dbiInteractionLocale = new InteractionLocale_1.DBIInteractionLocale(self, cfg);
                if (self.config.strict && self.data.interactionLocales.has(dbiInteractionLocale.name))
                    throw new Error(`DBIInteractionLocale "${dbiInteractionLocale.name}" already loaded!`);
                self.data.interactionLocales.set(dbiInteractionLocale.name, dbiInteractionLocale);
                return dbiInteractionLocale;
            };
            InteractionLocale = Object.assign(InteractionLocale, class {
                constructor(...args) { return InteractionLocale.apply(this, args); }
            });
            await cb({
                ChatInput,
                Event,
                ChatInputOptions,
                Locale,
                Button,
                StringSelectMenu,
                UserSelectMenu,
                RoleSelectMenu,
                ChannelSelectMenu,
                MentionableSelectMenu,
                MessageContextMenu,
                UserContextMenu,
                CustomEvent,
                Modal,
                InteractionLocale,
                onUnload(cb) {
                    self.data.registerUnloaders.add(cb);
                },
            });
        }
    }
    emit(name, args) {
        this.data.clients.forEach((d) => d.client.emit(name, { ...args, _DIRECT_: true }));
    }
    /**
     * this.data.interactions.get(name)
     */
    interaction(name) {
        return this.data.interactions.get(name);
    }
    client(name) {
        return name ? this.data.clients.get(name) : this.data.clients.first();
    }
    /**
     * this.data.events.get(name)
     */
    event(name) {
        return this.data.events.get(name);
    }
    /**
     * this.data.locales.get(name)
     */
    locale(name) {
        return this.data.locales.get(name);
    }
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    get(k, defaultValue) {
        if (defaultValue && !this.has(k)) {
            this.set(k, defaultValue);
            return defaultValue;
        }
        return lodash_1.default.get(this.data.other, k);
    }
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    set(k, v) {
        this.data.other = lodash_1.default.set(this.data.other, k, v);
    }
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    has(k) {
        return lodash_1.default.has(this.data.other, k);
    }
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    delete(k) {
        return lodash_1.default.unset(this.data.other, k);
    }
    async login() {
        await async_and_quick_1.default.quickForEach(this.data.clients, async (clientContext) => {
            await clientContext.client.login(this.config.sharding == "default" ? null : clientContext.token);
        });
    }
    async register(cb) {
        this.data.registers.add(cb);
    }
    async load() {
        if (this._loaded)
            return false;
        await this._registerAll();
        await this._hookListeners();
        this._loaded = true;
        return true;
    }
    async unload() {
        if (!this._loaded)
            return false;
        await this._unregisterAll();
        await this._unhookListeners();
        this._loaded = false;
        return true;
    }
    get loaded() {
        return this._loaded;
    }
    async publish(...args) {
        let interactions = this.data.interactions.filter(i => i.type == "ChatInput" || i.type == "MessageContextMenu" || i.type == "UserContextMenu");
        switch (args[0]) {
            case "Global": {
                return await (0, publishInteractions_1.publishInteractions)(this.data.clients, args[1] ? new discord_js_1.default.Collection() : interactions, this.data.interactionLocales, args[0]);
            }
            case "Guild": {
                return await (0, publishInteractions_1.publishInteractions)(this.data.clients, args[2] ? new discord_js_1.default.Collection() : interactions, this.data.interactionLocales, args[0], args[1]);
            }
        }
    }
}
exports.DBI = DBI;
//# sourceMappingURL=DBI.js.map