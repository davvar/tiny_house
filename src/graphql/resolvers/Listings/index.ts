import { IResolvers } from 'apollo-server-express'
import { IListing } from '../../../lib/types'

export const listingResolvers: IResolvers = {
	Listing: {
		id: (listing: IListing): string => listing._id.toString(),
	}
}
