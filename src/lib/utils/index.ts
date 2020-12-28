import { Request } from 'express'
import { Database, IUser } from '../types'

export const authorize = async (
	db: Database,
	req: Request
): Promise<IUser | null> => {
	const token = req.get('X-CSRF-TOKEN')

	const viewer = await db.users.findOne({
		_id: req.signedCookies.viewer,
		token,
	})

	return viewer
}
