import { IResolvers } from 'apollo-server-express';
import { findIndex } from 'lodash'
import listings from '../listings'

export const resolvers: IResolvers = {
	Query: {
		listings: () => listings,
	},

	Mutation: {
		deleteListing: (_root: undefined, { id }: { id: string }) => {
			const idx = findIndex(listings, { id })

			if (idx) return listings.splice(idx, 1)[0]
			else throw new Error('failed to delete listing')
		},
	},
}
