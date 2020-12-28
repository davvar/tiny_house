import { merge } from 'lodash'
import { userResolver } from './User'
import { viewerResolver } from './Viewer'

export const resolvers = merge(viewerResolver, userResolver)
