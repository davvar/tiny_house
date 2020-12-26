import dotenv from 'dotenv'
dotenv.config()

import { ObjectID } from 'mongodb'
import { connectDatabase } from '../src/database'
import { Database, Listing } from '../src/lib/types'

connectDatabase()
	.then((db: Database) => db.listings.insertMany(getDate()))
	.then(console.log, console.error)

function getDate() {
	return [
		{
			_id: new ObjectID(),
			title: 'Yerevan',
			image: '',
			address: 'string',
			price: 10,
			numOfGuests: 10,
			numOfBeds: 10,
			numOfBaths: 10,
			rating: 10,
		},
		{
			_id: new ObjectID(),
			title: 'Moscow',
			image: '',
			address: 'string',
			price: 1,
			numOfGuests: 1,
			numOfBeds: 1,
			numOfBaths: 1,
			rating: 1,
		},
		{
			_id: new ObjectID(),
			title: 'New York',
			image: '',
			address: 'string',
			price: 100,
			numOfGuests: 100,
			numOfBeds: 100,
			numOfBaths: 100,
			rating: 100,
		},
	] as Listing[]
}
