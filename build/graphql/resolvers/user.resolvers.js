"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolvers = void 0;
const utils_1 = require("../../lib/utils");
const errorHandler_1 = __importDefault(require("../../lib/utils/errorHandler"));
exports.userResolvers = {
    Query: {
        user: async (_root, { id }, { db, req }) => {
            try {
                const user = await db.users.findOne({ _id: id });
                if (!user) {
                    throw new Error("User can't be found");
                }
                const viewer = await utils_1.authorize({ db, req });
                if (viewer && viewer._id === user._id) {
                    user.authorized = true;
                }
                return user;
            }
            catch (error) {
                throw new Error(`Failed to query user: ${error}`);
            }
        },
    },
    User: {
        id: ({ _id }) => _id,
        hasWallet: ({ walletId }) => Boolean(walletId),
        income: ({ income, authorized }) => {
            return authorized ? income : null;
        },
        bookings: async (user, { limit, page }, { db }) => {
            try {
                if (!user.authorized) {
                    return null;
                }
                const data = {
                    total: 0,
                    result: [],
                };
                let cursor = await db.bookings.find({
                    _id: { $in: user.bookings },
                });
                cursor = cursor.skip(utils_1.getPageToSkip({ page, limit }));
                cursor = cursor.limit(limit);
                data.total = await cursor.count();
                data.result = await cursor.toArray();
                return data;
            }
            catch (error) {
                errorHandler_1.default({ error, msg: 'user bookings' });
            }
        },
        listings: async (user, { limit, page }, { db }) => {
            try {
                const data = {
                    total: 0,
                    result: [],
                };
                let cursor = await db.listings.find({
                    _id: { $in: user.listings },
                });
                cursor = cursor.skip(utils_1.getPageToSkip({ page, limit }));
                cursor = cursor.limit(limit);
                data.total = await cursor.count();
                data.result = await cursor.toArray();
                return data;
            }
            catch (error) {
                throw new Error(`Failed to query user bookings ${error}`);
            }
        },
    },
};
//# sourceMappingURL=user.resolvers.js.map