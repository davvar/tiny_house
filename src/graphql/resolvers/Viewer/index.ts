import { IResolvers } from 'apollo-server-express'
import { Google } from '../../../lib/api'
import { Database, IUser, IViewer } from '../../../lib/types'
import { LogInArgs } from './types'
import crypto from 'crypto'
import { get, isEmpty } from 'lodash'

const logInViaGoogle = async (
	code: string,
	token: string,
	db: Database
): Promise<IUser | undefined> => {
	const user = await Google.logIn(code)

	if (!user) {
		throw new Error('Google login error')
	}

	const userNamesList = isEmpty(user.names) ? null : user.names
	const userPhotosList = isEmpty(user.photos) ? null : user.photos
	const userEmailsList = isEmpty(user.emailAddresses)
		? null
		: user.emailAddresses

	const name = get(userNamesList, '[0].displayName', null)
	const id = get(userNamesList, '[0].metadata.source.id', null)
	const avatar = get(userPhotosList, '[0].url', null)
	const email = get(userEmailsList, '[0].value', null)

	if (!name || !id || !avatar || !email) {
		throw new Error('Google login error')
	}

	const updateRes = await db.users.findOneAndUpdate(
		{ _id: id },
		{
			$set: {
				name,
				avatar,
				contact: email,
				token,
			},
		},
		{ returnOriginal: false }
	)

	let viewer = updateRes.value

	if (!viewer) {
		const insertResult = await db.users.insertOne({
			_id: id,
			name,
			avatar,
			contact: email,
			token,
			income: 0,
			bookings: [],
			listings: [],
		})

		viewer = insertResult.ops[0]
	}

	return viewer
}

export const viewerResolver: IResolvers = {
	Query: {
		authUrl: (): string => {
			try {
				return Google.authUrl
			} catch (error) {
				throw new Error(`Failed to query Google Auth Url: ${error}`)
			}
		},
	},

	Mutation: {

		logIn: async (
			_root: undefined,
			{ input }: LogInArgs,
			{ db }: { db: Database }
		): Promise<IViewer> => {
			try {
				const code = input ? input.code : null
				const token = crypto.randomBytes(16).toString('hex')

				const viewer: IUser | undefined = code
					? await logInViaGoogle(code, token, db)
					: undefined

				if (!viewer) {
					return { didRequest: true }
				}

				return {
					_id: viewer._id,
					token: viewer.token,
					avatar: viewer.avatar,
					walletId: viewer.walletId,
					didRequest: true,
				}
			} catch (err) {
				throw new Error(`Failed to log in: ${err}`)
			}
		},

		logOut: (): IViewer => {
			try {
				return { didRequest: true }
			} catch (err) {
				throw new Error(`Failed to log out: ${err}`)
			}
    },

	},

	Viewer: {
		id: (viewer: IViewer): string | undefined => viewer._id,
		hasWallet: (viewer: IViewer): boolean | undefined => {
			return viewer.walletId ? true : undefined
		},
	},
}
