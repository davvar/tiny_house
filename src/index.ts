import dotenv from 'dotenv'
dotenv.config()

import express, { Application } from 'express'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs, resolvers } from './graphql'
import { connectDatabase } from './database'
import { IDatabase } from './lib/types'
import cookieParser from 'cookie-parser'

const mount = async (app: Application) => {
	const db: IDatabase = await connectDatabase()

	app.use(cookieParser(process.env.SECRET))

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
