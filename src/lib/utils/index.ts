import { get, set } from 'lodash';
import { MILLISECONDS_IN_DAY } from '../../graphql/resolvers/bookings.resolvers';
import { IBookingsIndex, IContext, IPaginationArgs, IUser } from '../../typings';

export const authorize = async ({
	db,
	req,
}: Omit<IContext, 'res'>): Promise<IUser | null> => {
	const token = req.get('X-CSRF-TOKEN')

	const viewer = await db.users.findOne({
		_id: req.signedCookies.viewer,
		token,
	})

	return viewer
}

export const getPageToSkip = ({ page, limit }: IPaginationArgs) =>
	page > 0 ? (page - 1) * limit : 0

export const resolveBookingsIndex = (
	bookingsIndex: IBookingsIndex,
	checkInDate: string,
	checkOutDate: string
): IBookingsIndex => {
	let dateCursor = new Date(checkInDate)
	const checkOut = new Date(checkOutDate)
	const newBookingsIndex: IBookingsIndex = { ...bookingsIndex }

	while (dateCursor <= checkOut) {
		const year = dateCursor.getUTCFullYear()
		const month = dateCursor.getUTCMonth()
		const day = dateCursor.getUTCDate()

		if (get(newBookingsIndex, `${year}.${month}.${day}`)) {
			throw new Error( "selected dates can't overlap dates that have already been booked." )
		} else {
			set(newBookingsIndex, `${year}.${month}.${day}`, true)
		}

		dateCursor = new Date(dateCursor.getTime() + MILLISECONDS_IN_DAY)
	}

	return newBookingsIndex
}
