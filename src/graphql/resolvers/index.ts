import { merge } from 'lodash'
import { listingsResolver } from './listings'

export const resolvers = merge(listingsResolver)
