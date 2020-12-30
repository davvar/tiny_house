import { merge } from 'lodash'
import { bookingResolvers } from './Bookings'
import { listingResolvers } from './Listings'
import { userResolver } from './User'
import { viewerResolver } from './Viewer'

export const resolvers = merge(
	viewerResolver,
	userResolver,
	listingResolvers,
	bookingResolvers
)
