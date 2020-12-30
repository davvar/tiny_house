import { IResolvers } from 'apollo-server-express'
import { Request } from 'express'
import { ObjectId } from 'mongodb'
import { IDatabase, IListing, IUser } from '../../../lib/types'
import { authorize } from '../../../lib/utils'
import errorHandler from '../../../lib/utils/errorHandler'
import { IPaginationArgs } from '../User/types'
import { IListingArgs, IListingBookingsData } from './types'

export const listingResolver: IResolvers = {
	Query: {
		listing: async (
			_root: undefined,
			{ id }: IListingArgs,
			{ db, req }: { db: IDatabase; req: Request }
		): Promise<IListing> => {
			try {
				const listing = await db.listings.findOne({ _id: new ObjectId(id) })

				if (!listing) {
					throw new Error("Listing can't be found")
				}

				const viewer = await authorize(db, req)
				if (viewer && viewer._id === listing.host) {
					listing.authorized = true
				}

				return listing
			} catch (error) {
				errorHandler({ error, msg: 'listing' })
			}
		},
	},

	Listing: {
		id: (listing: IListing): string => listing._id.toString(),

		host: async (
			listing: IListing,
			_args: Record<string, never>,
			{ db }: { db: IDatabase }
		): Promise<IUser> => {
			try {
				const host = await db.users.findOne({ _id: listing.host })

				if (!host) {
					throw new Error("Host can't be found")
				}

				return host
			} catch (error) {
				errorHandler({ error, msg: 'host' })
			}
		},

		bookingsIndex: (listing: IListing): string => {
			return JSON.stringify(listing.bookingsIndex)
		},

		bookings: async (
			listing: IListing,
			{ limit, page }: IPaginationArgs,
			{ db }: { db: IDatabase }
		): Promise<IListingBookingsData | null> => {
			try {
				if (!listing.authorized) {
					return null
				}

				const data: IListingBookingsData = {
					total: 0,
					result: [],
				}

				const cursor = await db.bookings.find({
					_id: { $in: listing.bookings },
				})

				cursor.skip(page > 0 ? (page - 1) * limit : 0)
				cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				errorHandler({ error, msg: 'listing bookings' })
			}
		},

	},
}
