"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const lodash_1 = require("lodash");
const bookings_resolvers_1 = require("./bookings.resolvers");
const listings_resolvers_1 = require("./listings.resolvers");
const user_resolvers_1 = require("./user.resolvers");
const viewer_resolvers_1 = require("./viewer.resolvers");
exports.resolvers = lodash_1.merge(viewer_resolvers_1.viewerResolvers, user_resolvers_1.userResolvers, listings_resolvers_1.listingResolvers, bookings_resolvers_1.bookingResolvers);
//# sourceMappingURL=index.js.map