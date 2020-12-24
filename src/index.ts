import dotenv from 'dotenv'
dotenv.config()

import express, { Application } from 'express'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs, resolvers } from './graphql'
import { connectDatabase } from './database'
import { Database } from './lib/types'

const mount = async (app: Application) => {
	const db: Database = await connectDatabase()
	const server = new ApolloServer({
		typeDefs,
		resolvers,
		context: () => ({ db }),
	})
	server.applyMiddleware({ app, path: '/api' })

	app.listen(process.env.PORT)
	console.log(`[app]: http://localhost:${process.env.PORT}`)
}

mount(express())
