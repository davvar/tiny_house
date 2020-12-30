import { merge } from 'lodash'
import { bookingResolver } from './Bookings/bookings.resolver'
import { listingResolver } from './Listings/listings.resolver'
import { userResolver } from './User/user.resolver'
import { viewerResolver } from './Viewer/viewer.resolver'

export const resolvers = merge(
	viewerResolver,
	userResolver,
	listingResolver,
	bookingResolver
)
