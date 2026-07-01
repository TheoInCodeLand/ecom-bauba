'use strict';

class SimpleCache {
    constructor() {
        this.store = new Map();
    }

    set(key, value, ttlSeconds = 300) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    invalidate(key) {
        this.store.delete(key);
    }

    invalidatePattern(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) this.store.delete(key);
        }
    }

    flush() {
        this.store.clear();
    }
}

module.exports = new SimpleCache();
