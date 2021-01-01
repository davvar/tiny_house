import { merge } from 'lodash';
import { bookingResolvers } from './bookings.resolvers';
import { listingResolvers } from './listings.resolvers';
import { userResolvers } from './user.resolvers';
import { viewerResolvers } from './viewer.resolvers';

export const resolvers = merge(
	viewerResolvers,
	userResolvers,
	listingResolvers,
	bookingResolvers
)
