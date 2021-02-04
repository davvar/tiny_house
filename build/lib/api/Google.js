"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Google = void 0;
const maps_1 = require("@google/maps");
const googleapis_1 = require("googleapis");
const auth = new googleapis_1.google.auth.OAuth2(process.env.G_CLIENT_ID, process.env.G_CLIENT_SECRET, `${process.env.PUBLIC_URL}/login`);
const maps = maps_1.createClient({
    key: `${process.env.G_GEOCODE_API}`,
    Promise,
});
exports.Google = {
    authUrl: auth.generateAuthUrl({
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
    }),
    logIn: async (code) => {
        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        const { data } = await googleapis_1.google.people({ version: 'v1', auth }).people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names,photos',
        });
        return data;
    },
    geocode: async (address) => {
        const { status, json } = await maps.geocode({ address }).asPromise();
        if (status < 200 || status > 299) {
            throw new Error('failed to geocode address');
        }
        return parseAddress(json.results[0].address_components);
    },
};
function parseAddress(addressComponents) {
    let country = null;
    let city = null;
    let admin = null;
    addressComponents.forEach(component => {
        if (component.types.includes('country')) {
            country = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
            admin = component.long_name;
        }
        if (component.types.includes('locality') ||
            component.types.includes('postal_town')) {
            city = component.long_name;
        }
    });
    return { admin, city, country };
}
//# sourceMappingURL=Google.js.map