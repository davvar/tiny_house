import { IResolvers } from 'apollo-server-express';
import { IBooking, IContext, IEmptyObject, IListing } from '../../typings';

export const bookingResolvers: IResolvers = {
	Booking: {
		id: (booking: IBooking): string => booking._id.toString(),
		listing: (
			booking: IBooking,
			_args: IEmptyObject,
			{ db }: IContext
		): Promise<IListing | null> => {
			return db.bookings.findOne<IListing>({ _id: booking.listing })
		},
	},
}
