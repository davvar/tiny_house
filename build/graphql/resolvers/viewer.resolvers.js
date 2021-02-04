"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewerResolvers = void 0;
const crypto_1 = __importDefault(require("crypto"));
const lodash_1 = require("lodash");
const api_1 = require("../../lib/api");
const utils_1 = require("../../lib/utils");
const cookieOptions = {
    httpOnly: true,
    sameSite: true,
    signed: true,
    secure: process.env.NODE_ENV !== 'development',
};
const logInViaGoogle = async (code, token, db, res) => {
    const user = await api_1.Google.logIn(code);
    if (!user) {
        throw new Error('Google login error');
    }
    const userNamesList = lodash_1.isEmpty(user.names) ? null : user.names;
    const userPhotosList = lodash_1.isEmpty(user.photos) ? null : user.photos;
    const userEmailsList = lodash_1.isEmpty(user.emailAddresses)
        ? null
        : user.emailAddresses;
    const name = lodash_1.get(userNamesList, '[0].displayName', null);
    const id = lodash_1.get(userNamesList, '[0].metadata.source.id', null);
    const avatar = lodash_1.get(userPhotosList, '[0].url', null);
    const email = lodash_1.get(userEmailsList, '[0].value', null);
    if (!name || !id || !avatar || !email) {
        throw new Error('Google login error');
    }
    const updateRes = await db.users.findOneAndUpdate({ _id: id }, {
        $set: {
            name,
            avatar,
            contact: email,
            token,
        },
    }, { returnOriginal: false });
    let viewer = updateRes.value;
    if (!viewer) {
        const insertResult = await db.users.insertOne({
            _id: id,
            name,
            avatar,
            contact: email,
            token,
            income: 0,
            bookings: [],
            listings: [],
        });
        viewer = insertResult.ops[0];
    }
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    res.cookie('viewer', id, Object.assign(Object.assign({}, cookieOptions), { maxAge: ONE_YEAR }));
    return viewer;
};
const loginViaCookie = async (token, db, req, res) => {
    const updatedRes = await db.users.findOneAndUpdate({ _id: req.signedCookies.viewer }, { $set: { token } }, { returnOriginal: false });
    const viewer = updatedRes.value;
    if (!viewer) {
        res.clearCookie('viewer', cookieOptions);
    }
    return viewer;
};
exports.viewerResolvers = {
    Query: {
        authUrl: () => {
            try {
                return api_1.Google.authUrl;
            }
            catch (error) {
                throw new Error(`Failed to query Google Auth Url: ${error}`);
            }
        },
    },
    Mutation: {
        logIn: async (_root, { input }, { db, req, res }) => {
            try {
                const code = input ? input.code : null;
                const token = crypto_1.default.randomBytes(16).toString('hex');
                const viewer = code
                    ? await logInViaGoogle(code, token, db, res)
                    : await loginViaCookie(token, db, req, res);
                if (!viewer) {
                    return { didRequest: true };
                }
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (err) {
                throw new Error(`Failed to log in: ${err}`);
            }
        },
        logOut: (_root, _args, { res }) => {
            try {
                res.clearCookie('viewer', cookieOptions);
                return { didRequest: true };
            }
            catch (err) {
                throw new Error(`Failed to log out: ${err}`);
            }
        },
        connectStripe: async (_root, { input }, { db, req }) => {
            try {
                const { code } = input;
                const viewer = await db.users.findOne({ _id: req.signedCookies.viewer });
                if (!viewer) {
                    throw new Error('viewer cannot be found');
                }
                const wallet = await api_1.Stripe.connect(code);
                if (!wallet) {
                    throw new Error('Stripe grant error');
                }
                return await api_1.updateWalletId({
                    db,
                    walletId: wallet.stripe_user_id,
                    viewerId: viewer._id,
                });
            }
            catch (error) {
                throw new Error(`Failed to connect to Stripe ${error}`);
            }
        },
        disconnectStripe: async (_root, _args, { db, req }) => {
            try {
                const viewer = await utils_1.authorize({ db, req });
                if (!viewer) {
                    throw new Error('viewer cannot be found');
                }
                return await api_1.updateWalletId({
                    db,
                    viewerId: viewer._id,
                });
            }
            catch (error) {
                throw new Error(`Failed to disconnect to Stripe ${error}`);
            }
        },
    },
    Viewer: {
        id: (viewer) => viewer._id,
        hasWallet: (viewer) => {
            return viewer.walletId ? true : undefined;
        },
    },
};
//# sourceMappingURL=viewer.resolvers.js.map