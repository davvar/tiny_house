import { google, people_v1 } from 'googleapis'

const auth = new google.auth.OAuth2(
	process.env.G_CLIENT_ID,
	process.env.G_CLIENT_SECRET,
	`${process.env.PUBLIC_URL}/login`
)

export const Google = {
	authUrl: auth.generateAuthUrl({
		scope: [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
		],
	}),
	logIn: async (code: string): Promise<people_v1.Schema$Person> => {
		const { tokens } = await auth.getToken(code)

		auth.setCredentials(tokens)

		const { data } = await google.people({ version: 'v1', auth }).people.get({
			resourceName: 'people/me',
			personFields: 'emailAddresses,names,photos',
		})

		return data
	},
}
