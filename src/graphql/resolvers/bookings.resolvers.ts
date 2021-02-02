import { IResolvers } from 'apollo-server-express';
import { ObjectId } from 'mongodb'
import { Stripe } from '../../lib/api'
import { authorize, resolveBookingsIndex } from '../../lib/utils'
import {
	IBooking,
	IContext,
	ICreateBookingArgs,
	IEmptyObject,
	IListing,
	IUser,
} from '../../typings'

export const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24

export const bookingResolvers: IResolvers = {
	Mutation: {
		createBooking: async (
			_root: undefined,
			{ input }: ICreateBookingArgs,
			{ db, req }: IContext
		): Promise<IBooking> => {
			try {
				const { checkIn, checkOut, id, source } = input

				const viewer = await authorize({ db, req })
				if (!viewer) {
					throw new Error("user can't be found")
				}

				const listing = await db.listings.findOne({ _id: new ObjectId(id) })
				if (!listing) {
					throw new Error("listing can't be found")
				}

				if (listing.host === viewer._id) {
					throw new Error("viewer can't book his own listing")
				}

				const checkInDate = new Date(checkIn)
				const checkOutDate = new Date(checkOut)
				if (checkOutDate < checkInDate) {
					throw new Error("check out date can't be before check in date")
				}

				const bookingsIndex = resolveBookingsIndex(
					listing.bookingsIndex,
					checkIn,
					checkOut
				)

				const daysToStay =
					(checkOutDate.getTime() - checkInDate.getTime()) /
						MILLISECONDS_IN_DAY +
					1
				const totalPrice = listing.price * daysToStay

				const host = await db.users.findOne({ _id: listing.host })
				if (!host || !host.walletId) {
					throw new Error(
						"the host either can't be found or not connected with stripe"
					)
				}

				await Stripe.charge(totalPrice, source, host.walletId)

				const insertRes = await db.bookings.insertOne({
					_id: new ObjectId(),
					listing: listing._id,
					checkIn,
					checkOut,
					tenant: viewer._id,
				})

				const insertedBooking: IBooking = insertRes.ops[0]

				await Promise.all([
					db.users.updateOne(
						{ _id: host._id },
						{ $inc: { income: totalPrice } }
					),
					db.users.updateOne(
						{ _id: viewer._id },
						{ $push: { bookings: insertedBooking._id } }
					),
					db.listings.updateOne(
						{ _id: listing._id },
						{
							$set: { bookingsIndex },
							$push: { bookings: insertedBooking._id },
						}
					),
				])

				return insertedBooking
			} catch (error) {
				throw new Error(`failed to create a booking ${error}`)
			}
		},
	},

	Booking: {
		id: (booking: IBooking): string => booking._id.toString(),

		listing: (
			booking: IBooking,
			_args: IEmptyObject,
			{ db }: IContext
		): Promise<IListing | null> => {
			return db.bookings.findOne<IListing>({ _id: booking.listing })
		},

		tenant: (
			booking: IBooking,
			_args: IEmptyObject,
			{ db }: IContext
		): Promise<IUser | null> => {
			return db.users.findOne({ _id: booking.tenant })
		},
	},
}
