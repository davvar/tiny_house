"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWalletId = exports.Stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client = new stripe_1.default(`${process.env.STRIPE_SECRET_KEY}`, {
    apiVersion: '2020-08-27',
});
exports.Stripe = {
    connect: async (code) => {
        return await client.oauth.token({
            grant_type: 'authorization_code',
            code,
        });
    },
    charge: async (amount, source, stripeAccount) => {
        const res = await client.charges.create({
            amount,
            currency: 'usd',
            source,
            application_fee_amount: Math.round(amount * 0.05),
        }, {
            stripeAccount,
        });
        if (res.status !== 'succeeded') {
            throw new Error('failed to create charge with Stripe');
        }
    },
};
const updateWalletId = async ({ db, viewerId, walletId, }) => {
    const { value: updatedViewer } = await db.users.findOneAndUpdate({ _id: viewerId }, { $set: { walletId } }, { returnOriginal: false });
    if (!updatedViewer) {
        throw new Error('viewer cannot be updated');
    }
    return {
        _id: updatedViewer._id,
        token: updatedViewer.token,
        avatar: updatedViewer.avatar,
        walletId: updatedViewer.walletId,
        didRequest: true,
    };
};
exports.updateWalletId = updateWalletId;
//# sourceMappingURL=Stripe.js.map