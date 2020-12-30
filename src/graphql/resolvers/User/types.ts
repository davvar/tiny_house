import { IBooking, IListing } from '../../../lib/types'

export interface IUserArgs {
	id: string
}

export interface IPaginationArgs {
	limit: number
	page: number
}

interface IUserData<T> {
	total: number
	result: T[]
}

export type IUserBookingsArgs = IPaginationArgs
export type IUserListingsArgs = IPaginationArgs

export type IUserBookingsData = IUserData<IBooking>
export type IUserListingsData = IUserData<IListing>
