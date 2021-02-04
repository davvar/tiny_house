"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBookingsIndex = exports.getPageToSkip = exports.authorize = void 0;
const lodash_1 = require("lodash");
const bookings_resolvers_1 = require("../../graphql/resolvers/bookings.resolvers");
const authorize = async ({ db, req, }) => {
    const token = req.get('X-CSRF-TOKEN');
    const viewer = await db.users.findOne({
        _id: req.signedCookies.viewer,
        token,
    });
    return viewer;
};
exports.authorize = authorize;
const getPageToSkip = ({ page, limit }) => page > 0 ? (page - 1) * limit : 0;
exports.getPageToSkip = getPageToSkip;
const resolveBookingsIndex = (bookingsIndex, checkInDate, checkOutDate) => {
    let dateCursor = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const newBookingsIndex = Object.assign({}, bookingsIndex);
    while (dateCursor <= checkOut) {
        const year = dateCursor.getUTCFullYear();
        const month = dateCursor.getUTCMonth();
        const day = dateCursor.getUTCDate();
        if (lodash_1.get(newBookingsIndex, `${year}.${month}.${day}`)) {
            throw new Error("selected dates can't overlap dates that have already been booked.");
        }
        else {
            lodash_1.set(newBookingsIndex, `${year}.${month}.${day}`, true);
        }
        dateCursor = new Date(dateCursor.getTime() + bookings_resolvers_1.MILLISECONDS_IN_DAY);
    }
    return newBookingsIndex;
};
exports.resolveBookingsIndex = resolveBookingsIndex;
//# sourceMappingURL=index.js.map