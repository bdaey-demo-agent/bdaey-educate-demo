
export const safeJsonParse = (value: any, fallback: any = null) => {
    if (value === null || value === undefined) return fallback;
    if (value === "undefined" || value === "null") return fallback;
    if (typeof value !== "string") return value; // Already an object/number/boolean

    try {
        return JSON.parse(value);
    } catch (e) {
        console.warn("JSON Parse Error:", e, "Value:", value);
        return fallback;
    }
};
