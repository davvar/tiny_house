/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IResolvers } from 'apollo-server-express'
import { isEqual } from 'lodash'
import { ObjectId } from 'mongodb'
import { Cloudinary, Google } from '../../lib/api'
import { authorize, getPageToSkip } from '../../lib/utils'
import errorHandler from '../../lib/utils/errorHandler'
import {
	IBooking,
	IContext,
	IEmptyObject,
	IHostListingsArgs,
	IHostListingsInput,
	IList,
	IListing,
	IListingsArgs,
	IListingsData,
	IListingsQuery,
	IPaginationArgs,
	IUser,
	ListingsFilter,
	ListingType,
} from '../../typings'

const verifyHostListingInput = ({
	title,
	description,
	type,
	price,
}: IHostListingsInput) => {
	if (title.length > 100) {
		throw new Error('listing title must be under 100 characters')
	}

	if (description.length > 5000) {
		throw new Error('listing description must be under 5000 characters')
	}

	if (type !== ListingType.Apartment && type !== ListingType.House) {
		throw new Error('listing type must be either house or apartment')
	}

	if (price <= 0) {
		throw new Error('price must be greater then 0')
	}
}

export const listingResolvers: IResolvers = {
	Mutation: {
		hostListing: async (
			_root: undefined,
			{ input }: IHostListingsArgs,
			{ db, req }: IContext
		): Promise<IListing> => {
			verifyHostListingInput(input)

			const viewer = await authorize({ req, db })
			if (!viewer) {
				throw new Error('viewer cannot be found')
			}

			const { admin, city, country } = await Google.geocode(input.address)
			if (!admin || !city || !country) {
				throw new Error('invalid address input')
			}

			const imageUrl = await Cloudinary.upload(input.image)

			const insertResult = await db.listings.insertOne({
				_id: new ObjectId(),
				...input,
				image: imageUrl,
				bookings: [],
				bookingsIndex: {},
				country: country!,
				city: city!,
				admin: admin!,
				host: viewer._id,
			})

			const insertedListing: IListing = insertResult.ops[0]

			await db.users.findOneAndUpdate(
				{ _id: viewer._id },
				{ $push: { listings: insertedListing._id } }
			)

			return insertedListing
		},
	},
	Query: {
		listing: async (
			_root: undefined,
			{ id }: { id: string },
			{ db, req }: IContext
		): Promise<IListing> => {
			try {
				const listing = await db.listings.findOne({ _id: new ObjectId(id) })

				if (!listing) {
					throw new Error("Listing can't be found")
				}

				const viewer = await authorize({ db, req })
				if (viewer && viewer._id === listing.host) {
					listing.authorized = true
				}

				return listing
			} catch (error) {
				errorHandler({ error, msg: 'listing' })
			}
		},
		listings: async (
			_root: undefined,
			{ location, filter, limit, page }: IListingsArgs,
			{ db }: IContext
		): Promise<IListingsData> => {
			try {
				const query: IListingsQuery = {}
				const data: IListingsData = {
					region: null,
					total: 0,
					result: [],
				}

				if (location) {
					const { admin, city, country } = await Google.geocode(location)
					if (admin) query.admin = admin!
					if (city) query.city = city!

					if (country) query.country = country!
					else throw new Error('no country found')

					data.region = `"${city ? `${city},` : ''}${
						admin ? ` ${admin},` : ''
					} ${country || ''}"`
				}

				let cursor = await db.listings.find<IListing>(query)

				if (isEqual(filter, ListingsFilter.PRICE_LOW_TO_HIGH)) {
					cursor = cursor.sort({ price: 1 })
				} else if (isEqual(filter, ListingsFilter.PRICE_HIGH_TO_LOW)) {
					cursor = cursor.sort({ price: -1 })
				}

				cursor = cursor.skip(getPageToSkip({ page, limit }))
				cursor = cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				errorHandler({ error, msg: 'listings' })
			}
		},
	},

	Listing: {
		id: (listing: IListing): string => listing._id.toString(),

		host: async (
			listing: IListing,
			_args: IEmptyObject,
			{ db }: IContext
		): Promise<IUser> => {
			try {
				const host = await db.users.findOne<IUser>({ _id: listing.host })

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
			{ db }: IContext
		): Promise<IList<IBooking> | null> => {
			try {
				if (!listing.authorized) {
					return null
				}

				const data: IList<IBooking> = {
					total: 0,
					result: [],
				}

				let cursor = await db.bookings.find<IBooking>({
					_id: { $in: listing.bookings },
				})

				cursor = cursor.skip(getPageToSkip({ page, limit }))
				cursor = cursor.limit(limit)

				data.total = await cursor.count()
				data.result = await cursor.toArray()

				return data
			} catch (error) {
				errorHandler({ error, msg: 'listing bookings' })
			}
		},
	},
}
