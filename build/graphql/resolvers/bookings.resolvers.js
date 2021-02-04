"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResolvers = exports.MILLISECONDS_IN_DAY = void 0;
const mongodb_1 = require("mongodb");
const api_1 = require("../../lib/api");
const utils_1 = require("../../lib/utils");
exports.MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
exports.bookingResolvers = {
    Mutation: {
        createBooking: async (_root, { input }, { db, req }) => {
            try {
                const { checkIn, checkOut, id, source } = input;
                const viewer = await utils_1.authorize({ db, req });
                if (!viewer) {
                    throw new Error("user can't be found");
                }
                const listing = await db.listings.findOne({ _id: new mongodb_1.ObjectId(id) });
                if (!listing) {
                    throw new Error("listing can't be found");
                }
                if (listing.host === viewer._id) {
                    throw new Error("viewer can't book his own listing");
                }
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                if (checkOutDate < checkInDate) {
                    throw new Error("check out date can't be before check in date");
                }
                const bookingsIndex = utils_1.resolveBookingsIndex(listing.bookingsIndex, checkIn, checkOut);
                const daysToStay = (checkOutDate.getTime() - checkInDate.getTime()) /
                    exports.MILLISECONDS_IN_DAY +
                    1;
                const totalPrice = listing.price * daysToStay;
                const host = await db.users.findOne({ _id: listing.host });
                if (!host || !host.walletId) {
                    throw new Error("the host either can't be found or not connected with stripe");
                }
                await api_1.Stripe.charge(totalPrice, source, host.walletId);
                const insertRes = await db.bookings.insertOne({
                    _id: new mongodb_1.ObjectId(),
                    listing: listing._id,
                    checkIn,
                    checkOut,
                    tenant: viewer._id,
                });
                const insertedBooking = insertRes.ops[0];
                await Promise.all([
                    db.users.updateOne({ _id: host._id }, { $inc: { income: totalPrice } }),
                    db.users.updateOne({ _id: viewer._id }, { $push: { bookings: insertedBooking._id } }),
                    db.listings.updateOne({ _id: listing._id }, {
                        $set: { bookingsIndex },
                        $push: { bookings: insertedBooking._id },
                    }),
                ]);
                return insertedBooking;
            }
            catch (error) {
                throw new Error(`failed to create a booking ${error}`);
            }
        },
    },
    Booking: {
        id: (booking) => booking._id.toString(),
        listing: (booking, _args, { db }) => {
            return db.bookings.findOne({ _id: booking.listing });
        },
        tenant: (booking, _args, { db }) => {
            return db.users.findOne({ _id: booking.tenant });
        },
    },
};
//# sourceMappingURL=bookings.resolvers.js.map