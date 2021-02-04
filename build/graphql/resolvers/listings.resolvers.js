"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingResolvers = void 0;
const lodash_1 = require("lodash");
const mongodb_1 = require("mongodb");
const api_1 = require("../../lib/api");
const utils_1 = require("../../lib/utils");
const errorHandler_1 = __importDefault(require("../../lib/utils/errorHandler"));
const typings_1 = require("../../typings");
const verifyHostListingInput = ({ title, description, type, price, }) => {
    if (title.length > 100) {
        throw new Error('listing title must be under 100 characters');
    }
    if (description.length > 5000) {
        throw new Error('listing description must be under 5000 characters');
    }
    if (type !== typings_1.ListingType.Apartment && type !== typings_1.ListingType.House) {
        throw new Error('listing type must be either house or apartment');
    }
    if (price <= 0) {
        throw new Error('price must be greater then 0');
    }
};
exports.listingResolvers = {
    Mutation: {
        hostListing: async (_root, { input }, { db, req }) => {
            verifyHostListingInput(input);
            const viewer = await utils_1.authorize({ req, db });
            if (!viewer) {
                throw new Error('viewer cannot be found');
            }
            const { admin, city, country } = await api_1.Google.geocode(input.address);
            if (!admin || !city || !country) {
                throw new Error('invalid address input');
            }
            const imageUrl = await api_1.Cloudinary.upload(input.image);
            const insertResult = await db.listings.insertOne(Object.assign(Object.assign({ _id: new mongodb_1.ObjectId() }, input), { image: imageUrl, bookings: [], bookingsIndex: {}, country: country, city: city, admin: admin, host: viewer._id }));
            const insertedListing = insertResult.ops[0];
            await db.users.findOneAndUpdate({ _id: viewer._id }, { $push: { listings: insertedListing._id } });
            return insertedListing;
        },
    },
    Query: {
        listing: async (_root, { id }, { db, req }) => {
            try {
                const listing = await db.listings.findOne({ _id: new mongodb_1.ObjectId(id) });
                if (!listing) {
                    throw new Error("Listing can't be found");
                }
                const viewer = await utils_1.authorize({ db, req });
                if (viewer && viewer._id === listing.host) {
                    listing.authorized = true;
                }
                return listing;
            }
            catch (error) {
                errorHandler_1.default({ error, msg: 'listing' });
            }
        },
        listings: async (_root, { location, filter, limit, page }, { db }) => {
            try {
                const query = {};
                const data = {
                    region: null,
                    total: 0,
                    result: [],
                };
                if (location) {
                    const { admin, city, country } = await api_1.Google.geocode(location);
                    if (admin)
                        query.admin = admin;
                    if (city)
                        query.city = city;
                    if (country)
                        query.country = country;
                    else
                        throw new Error('no country found');
                    data.region = `"${city ? `${city},` : ''}${admin ? ` ${admin},` : ''} ${country || ''}"`;
                }
                let cursor = await db.listings.find(query);
                if (lodash_1.isEqual(filter, typings_1.ListingsFilter.PRICE_LOW_TO_HIGH)) {
                    cursor = cursor.sort({ price: 1 });
                }
                else if (lodash_1.isEqual(filter, typings_1.ListingsFilter.PRICE_HIGH_TO_LOW)) {
                    cursor = cursor.sort({ price: -1 });
                }
                cursor = cursor.skip(utils_1.getPageToSkip({ page, limit }));
                cursor = cursor.limit(limit);
                data.total = await cursor.count();
                data.result = await cursor.toArray();
                return data;
            }
            catch (error) {
                errorHandler_1.default({ error, msg: 'listings' });
            }
        },
    },
    Listing: {
        id: (listing) => listing._id.toString(),
        host: async (listing, _args, { db }) => {
            try {
                const host = await db.users.findOne({ _id: listing.host });
                if (!host) {
                    throw new Error("Host can't be found");
                }
                return host;
            }
            catch (error) {
                errorHandler_1.default({ error, msg: 'host' });
            }
        },
        bookingsIndex: (listing) => {
            return JSON.stringify(listing.bookingsIndex);
        },
        bookings: async (listing, { limit, page }, { db }) => {
            try {
                if (!listing.authorized) {
                    return null;
                }
                const data = {
                    total: 0,
                    result: [],
                };
                let cursor = await db.bookings.find({
                    _id: { $in: listing.bookings },
                });
                cursor = cursor.skip(utils_1.getPageToSkip({ page, limit }));
                cursor = cursor.limit(limit);
                data.total = await cursor.count();
                data.result = await cursor.toArray();
                return data;
            }
            catch (error) {
                errorHandler_1.default({ error, msg: 'listing bookings' });
            }
        },
    },
};
//# sourceMappingURL=listings.resolvers.js.map