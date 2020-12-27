import { Collection, ObjectId, ObjectID } from 'mongodb'

export interface IViewer {
	_id?: string
	token?: string
	avatar?: string
	walletId?: string
	didRequest: boolean
}

export enum ListingType {
	Apartment = 'APARTMENT',
	House = 'HOUSE',
}

export interface IBookingIndexMonth {
	[key: string]: boolean
}

export interface IBookingIndexYear {
	[month: string]: IBookingIndexMonth
}

export interface IBookingIndex {
	[year: string]: IBookingIndexYear
}

export interface IBooking {
	_id: ObjectID
	listing: ObjectId
	tenant: string
	checkIn: string
	checkOut: string
}

export interface Listing {
	_id: ObjectID
	title: string
	description: string
	image: string
	host: string
	type: ListingType
	address: string
	country: string
	admin: string
	city: string
	bookings: ObjectId[]
	bookingsIndex: IBookingIndex
	price: number
	numOfGuests: number
	// numOfBeds: number
	// numOfBaths: number
	// rating: number
}

export interface IUser {
	_id: string
	token: string
	name: string
	avatar: string
	contact: string
	walletId?: string
	income: number
	bookings: ObjectId[]
	listings: ObjectId[]
}

export interface Database {
	listings: Collection<Listing>
	users: Collection<IUser>
	bookings: Collection<IBooking>
}
