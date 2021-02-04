"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongodb_1 = require("mongodb");
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/tiny-house?retryWrites=true&w=majority`;
const connectDatabase = async () => {
    const client = await mongodb_1.MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = client.db();
    return {
        bookings: db.collection('bookings'),
        listings: db.collection('listings'),
        users: db.collection('users'),
    };
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=index.js.map