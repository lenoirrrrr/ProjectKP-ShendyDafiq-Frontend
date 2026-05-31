export function ok(data = null, meta = {}) {
    return { ok: true, data, meta };
}

export function fail(message, error = null, meta = {}) {
    return { ok: false, message, error, meta };
}
