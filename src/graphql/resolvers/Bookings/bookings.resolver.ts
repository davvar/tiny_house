import { IResolvers } from 'apollo-server-express'
import { IBooking, IDatabase, IListing } from '../../../lib/types'

export const bookingResolver: IResolvers = {
	Booking: {
		id: (booking: IBooking): string => booking._id.toString(),
		listing: (
			booking: IBooking,
			_args: Record<string, never>,
			{ db }: { db: IDatabase }
		): Promise<IListing | null> => {
			return db.bookings.findOne({ _id: booking.listing })
		},
	},
}
