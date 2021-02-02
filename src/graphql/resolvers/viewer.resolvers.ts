import { IResolvers } from 'apollo-server-express'
import crypto from 'crypto'
import { CookieOptions, Request, Response } from 'express'
import { get, isEmpty } from 'lodash'
import { Google, Stripe, updateWalletId } from '../../lib/api'
import { authorize } from '../../lib/utils'
import {
	ConnectStripeArgs,
	IContext,
	IDatabase,
	IEmptyObject,
	IUser,
	IViewer,
	LogInArgs,
} from '../../typings'

const cookieOptions: CookieOptions = {
	httpOnly: true,
	sameSite: true,
	signed: true,
	secure: process.env.NODE_ENV !== 'development',
}

const logInViaGoogle = async (
	code: string,
	token: string,
	db: IDatabase,
	res: Response
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

	const ONE_YEAR = 365 * 24 * 60 * 60 * 1000
	res.cookie('viewer', id, {
		...cookieOptions,
		maxAge: ONE_YEAR,
	})

	return viewer
}

const loginViaCookie = async (
	token: string,
	db: IDatabase,
	req: Request,
	res: Response
): Promise<IUser | undefined> => {
	const updatedRes = await db.users.findOneAndUpdate(
		{ _id: req.signedCookies.viewer },
		{ $set: { token } },
		{ returnOriginal: false }
	)

	const viewer = updatedRes.value

	if (!viewer) {
		res.clearCookie('viewer', cookieOptions)
	}

	return viewer
}

export const viewerResolvers: IResolvers = {
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
			{ db, req, res }: { db: IDatabase; req: Request; res: Response }
		): Promise<IViewer> => {
			try {
				const code = input ? input.code : null
				const token = crypto.randomBytes(16).toString('hex')

				const viewer: IUser | undefined = code
					? await logInViaGoogle(code, token, db, res)
					: await loginViaCookie(token, db, req, res)

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

		logOut: (
			_root: undefined,
			_args: IEmptyObject,
			{ res }: IContext
		): IViewer => {
			try {
				res.clearCookie('viewer', cookieOptions)
				return { didRequest: true }
			} catch (err) {
				throw new Error(`Failed to log out: ${err}`)
			}
		},

		connectStripe: async (
			_root: undefined,
			{ input }: ConnectStripeArgs,
			{ db, req }: IContext
		): Promise<IViewer> => {
			try {
				const { code } = input

				const viewer = await db.users.findOne({ _id: req.signedCookies.viewer })
				if (!viewer) {
					throw new Error('viewer cannot be found')
				}

				const wallet = await Stripe.connect(code)
				if (!wallet) {
					throw new Error('Stripe grant error')
				}

				return await updateWalletId({
					db,
					walletId: wallet.stripe_user_id as string,
					viewerId: viewer._id,
				})
			} catch (error) {
				throw new Error(`Failed to connect to Stripe ${error}`)
			}
		},

		disconnectStripe: async (
			_root: undefined,
			_args: IEmptyObject,
			{ db, req }: IContext
		): Promise<IViewer> => {
			try {
				const viewer = await authorize({ db, req })
				if (!viewer) {
					throw new Error('viewer cannot be found')
				}

				return await updateWalletId({
					db,
					viewerId: viewer._id,
				})
			} catch (error) {
				throw new Error(`Failed to disconnect to Stripe ${error}`)
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
