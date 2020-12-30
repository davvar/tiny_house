export default function errorHandler({
	msg = '',
	error,
}: {
	msg: string
	error: Error
}): never {
	throw new Error(`Failed to query ${msg}: ${error}`)
}
