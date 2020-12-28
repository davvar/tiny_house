import { IResolvers } from 'apollo-server-express'
import { Request } from 'express'
import { IDatabase, IUser } from '../../../lib/types'
import { authorize } from '../../../lib/utils'
import {
	IUserArgs,
	IUserBookingsArgs,
	IUserBookingsData,
	IUserListingsArgs,
	IUserListingsData,
} from './types'

export const userResolver: IResolvers = {
	Query: {
		user: async (
			_root: undefined,
			{ id }: IUserArgs,
			{ db, req }: { db: IDatabase; req: Request }
		): Promise<IUser> => {
			try {
				const user = await db.users.findOne({ _id: id })

				if (!user) {
					throw new Error("User can't be found")
				}

				const viewer = await authorize(db, req)
				if (viewer && viewer._id === user._id) {
					user.authorized = true
				}

				return user
			} catch (error) {
				throw new Error(`Failed to query user: ${error}`)
			}
		},
  },

	User: {
		id: ({ _id }: IUser): string => _id,
		hasWallet: ({ walletId }: IUser): boolean => Boolean(walletId),
		income: ({ income, authorized }: IUser): number | null => {
			return authorized ? income : null
		},
		bookings: async (
			user: IUser,
			{ limit, page }: IUserBookingsArgs,
			{ db }: { db: IDatabase }
		): Promise<IUserBookingsData | null> => {
			try {
				if (!user.authorized) {
					return null
				}

				const data: IUserBookingsData = {
					total: 0,
					result: [],
				}

				const cursor = await db.bookings.find({
					_id: { $in: user.bookings },
				})

				cursor.skip(page > 0 ? (page - 1) * limit : 0)
				cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				throw new Error(`Failed to query user bookings ${error}`)
			}
		},
		listings: async (
			user: IUser,
			{ limit, page }: IUserListingsArgs,
			{ db }: { db: IDatabase }
		): Promise<IUserListingsData | null> => {
			try {
				const data: IUserListingsData = {
					total: 0,
					result: [],
				}

				const cursor = await db.listings.find({
					_id: { $in: user.listings },
				})

				cursor.skip(page > 0 ? (page - 1) * limit : 0)
				cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				throw new Error(`Failed to query user bookings ${error}`)
			}
		},
	},
}
