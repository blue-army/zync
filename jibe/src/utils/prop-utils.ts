
function _str(val: string, fallback: string): string {

    if (!val || val.length === 0) {
        return fallback;
    }

    return val;
}

export {
    _str,
}