import { Request, Response } from 'express'
import { Collection, ObjectID } from 'mongodb'

export interface IViewer {
	_id?: string
	token?: string
	avatar?: string
	walletId?: string
	didRequest: boolean
}

export interface IUser {
	_id: string
	token: string
	name: string
	avatar: string
	contact: string
	walletId?: string
	income: number
	bookings: IBooking['_id'][]
	listings: IListing['_id'][]
	authorized?: boolean
}

export interface IBooking {
	_id: ObjectID
	listing: IListing['_id']
	tenant: IUser['_id']
	checkIn: string
	checkOut: string
}

export interface IListing {
	_id: ObjectID
	title: string
	description: string
	image: string
	host: IUser['_id']
	type: ListingType
	address: string
	country: string
	admin: string
	city: string
	bookings: IBooking['_id'][]
	bookingsIndex: {
		[year: string]: {
			[month: string]: {
				[day: string]: boolean
			}
		}
	}
	price: number
	numOfGuests: number
	authorized?: boolean
}

export interface IList<T> {
	total: number
	result: T[]
}

export interface IPaginationArgs {
	limit: number
	page: number
}

export interface LogInArgs {
	input: { code: string } | null
}

export interface IListingsArgs extends IPaginationArgs {
	filter: ListingsFilter
	location?: string
}

export interface IListingsQuery {
	country?: string
	admin?: string
	city?: string
}

export interface IListingsData extends IList<IListing> {
	region: string | null
}

export interface IDatabase {
	listings: Collection<IListing>
	users: Collection<IUser>
	bookings: Collection<IBooking>
}

export interface IContext {
	db: IDatabase
	req: Request
	res: Response
}

export enum ListingType {
	Apartment = 'APARTMENT',
	House = 'HOUSE',
}

export enum ListingsFilter {
	PRICE_LOW_TO_HIGH = 'PRICE_LOW_TO_HIGH',
	PRICE_HIGH_TO_LOW = 'PRICE_HIGH_TO_LOW',
}

export type IEmptyObject = Record<string, never>

export interface ConnectStripeArgs {
	input: { code: string }
}

export interface IHostListingsInput {
	title: string
	description: string
	image: string
	address: string
	type: ListingType
	price: number
	numOfGuests: number
}

export interface IHostListingsArgs {
	input: IHostListingsInput
}
