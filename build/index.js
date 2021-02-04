"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const middleware_1 = require("graphql-voyager/middleware");
const database_1 = require("./database");
const graphql_1 = require("./graphql");
const mount = async (app) => {
    const db = await database_1.connectDatabase();
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use(cookie_parser_1.default(process.env.SECRET));
    app.use('/voyager', middleware_1.express({ endpointUrl: '/api' }));
    app.use(compression_1.default());
    app.use(express_1.default.static(`${__dirname}/client`));
    app.get('/*', (_req, res) => res.sendFile(`${__dirname}/client/index.html`));
    const server = new apollo_server_express_1.ApolloServer({
        typeDefs: graphql_1.typeDefs,
        resolvers: graphql_1.resolvers,
        context: ({ req, res }) => ({ db, req, res }),
    });
    server.applyMiddleware({ app, path: '/api' });
    app.listen(process.env.PORT);
    console.log(`[app]: http://localhost:${process.env.PORT}`);
};
mount(express_1.default());
//# sourceMappingURL=index.js.map