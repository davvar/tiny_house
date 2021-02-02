import stripe from 'stripe'
import { IDatabase } from '../../typings'

const client = new stripe(`${process.env.STRIPE_SECRET_KEY}`, {
	apiVersion: '2020-08-27',
})

export const Stripe = {
	connect: async (code: string) => {
		return await client.oauth.token({
			grant_type: 'authorization_code',
			code,
		})
	},

	charge: async (amount: number, source: string, stripeAccount: string) => {
		const res = await client.charges.create(
			{
				amount,
				currency: 'usd',
				source,
				application_fee_amount: Math.round(amount * 0.05),
			},
			{
				stripeAccount,
			}
		)

		if (res.status !== 'succeeded') {
			throw new Error('failed to create charge with Stripe')
		}
	},
}

export const updateWalletId = async ({
	db,
	viewerId,
	walletId,
}: {
	db: IDatabase
	viewerId: string
	walletId?: string
}) => {
	const { value: updatedViewer } = await db.users.findOneAndUpdate(
		{ _id: viewerId },
		{ $set: { walletId } },
		{ returnOriginal: false }
	)

	if (!updatedViewer) {
		throw new Error('viewer cannot be updated')
	}

	return {
		_id: updatedViewer._id,
		token: updatedViewer.token,
		avatar: updatedViewer.avatar,
		walletId: updatedViewer.walletId,
		didRequest: true,
	}
}
