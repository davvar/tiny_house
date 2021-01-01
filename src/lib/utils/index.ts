import { IContext, IPaginationArgs, IUser } from '../../typings';

export const authorize = async ({
	db,
	req,
}: Omit<IContext, 'res'>): Promise<IUser | null> => {
	const token = req.get('X-CSRF-TOKEN')

	const viewer = await db.users.findOne({
		_id: req.signedCookies.viewer,
		token,
	})

	return viewer
}

export const getPageToSkip = ({ page, limit }: IPaginationArgs) =>
	page > 0 ? (page - 1) * limit : 0
