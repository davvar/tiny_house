import { IResolvers } from 'apollo-server-express';
import { authorize, getPageToSkip } from '../../lib/utils';
import errorHandler from '../../lib/utils/errorHandler';
import { IBooking, IContext, IList, IListing, IPaginationArgs, IUser } from '../../typings';

export const userResolvers: IResolvers = {
	Query: {
		user: async (
			_root: undefined,
			{ id }: { id: string },
			{ db, req }: IContext
		): Promise<IUser> => {
			try {
				const user = await db.users.findOne<IUser>({ _id: id })

				if (!user) {
					throw new Error("User can't be found")
				}

				const viewer = await authorize({ db, req })
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
			{ limit, page }: IPaginationArgs,
			{ db }: IContext
		): Promise<IList<IBooking> | null> => {
			try {
				if (!user.authorized) {
					return null
				}

				const data: IList<IBooking> = {
					total: 0,
					result: [],
				}

				let cursor = await db.bookings.find<IBooking>({
					_id: { $in: user.bookings },
				})

				cursor = cursor.skip(getPageToSkip({ page, limit }))
				cursor = cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				errorHandler({ error, msg: 'user bookings' })
			}
		},
		listings: async (
			user: IUser,
			{ limit, page }: IPaginationArgs,
			{ db }: IContext
		): Promise<IList<IListing> | null> => {
			try {
				const data: IList<IListing> = {
					total: 0,
					result: [],
				}

				let cursor = await db.listings.find<IListing>({
					_id: { $in: user.listings },
				})

				cursor = cursor.skip(getPageToSkip({page, limit}))
				cursor = cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				throw new Error(`Failed to query user bookings ${error}`)
			}
		},
	},
}
