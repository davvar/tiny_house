// eslint-disable-next-line
require('dotenv').config()
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import { express as voyagerMiddleware } from 'graphql-voyager/middleware';
import { connectDatabase } from './database';
import { resolvers, typeDefs } from './graphql';
import { IContext, IDatabase } from './typings';

const mount = async (app: Application) => {
	const db: IDatabase = await connectDatabase()

	app.use(bodyParser.json({ limit: '2mb' }))
	app.use(cookieParser(process.env.SECRET))
	app.use('/voyager', voyagerMiddleware({ endpointUrl: '/api' }))

	const server = new ApolloServer({
		typeDefs,
		resolvers,
		context: ({ req, res }): IContext => ({ db, req, res }),
	})

	server.applyMiddleware({ app, path: '/api' })

	app.listen(process.env.PORT)
	console.log(`[app]: http://localhost:${process.env.PORT}`)
}

mount(express())
