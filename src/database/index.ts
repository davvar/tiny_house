import { MongoClient } from 'mongodb';
import { IBooking, IDatabase, IListing, IUser } from '../typings';

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/tiny-house?retryWrites=true&w=majority`

export const connectDatabase = async (): Promise<IDatabase> => {
	const client = await MongoClient.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})

	const db = client.db()

	return {
		bookings: db.collection<IBooking>('bookings'),
		listings: db.collection<IListing>('listings'),
		users: db.collection<IUser>('users'),
	}
}
