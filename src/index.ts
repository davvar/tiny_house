import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import { express as voyagerMiddleware } from 'graphql-voyager/middleware';
import { connectDatabase } from './database';
import { resolvers, typeDefs } from './graphql';
import { IDatabase } from './lib/types';
dotenv.config()

const mount = async (app: Application) => {
	const db: IDatabase = await connectDatabase()

	app.use(cookieParser(process.env.SECRET))
	app.use('/voyager', voyagerMiddleware({ endpointUrl: '/api' }))

	const server = new ApolloServer({
		typeDefs,
		resolvers,
		context: ({ req, res }) => ({ db, req, res }),
	})
	server.applyMiddleware({ app, path: '/api' })

	app.listen(process.env.PORT)
	console.log(`[app]: http://localhost:${process.env.PORT}`)
}

mount(express())
