export const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Stationery', 'Other'] as const;
export const CONDITIONS = ['Like new', 'Good', 'Fair', 'Well used'] as const;
export const TYPES = ['For Sale', 'Free', 'Exchange'] as const;
export const STATUSES = ['Available', 'Reserved', 'Sold'] as const;
export const CONTACT_METHODS = ['Campus meetup', 'In-app enquiries', 'Email after enquiry'] as const;
export const SORTS = ['newest', 'price-low', 'price-high', 'relevance'] as const;

export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 950_000;
export const MAX_PRICE = 1_000_000;
export const PAGE_SIZE = 12;

export type Seller = {
  id: string;
  name: string;
  campus: string;
  bio: string;
  contact: (typeof CONTACT_METHODS)[number];
  createdAt: string;
};

export type Listing = {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: (typeof CATEGORIES)[number];
  condition: (typeof CONDITIONS)[number];
  type: (typeof TYPES)[number];
  status: (typeof STATUSES)[number];
  active: boolean;
  deleted: boolean;
  photos: string[];
  campus: string;
  createdAt: string;
};

export type Enquiry = {
  id: string;
  listingId: string;
  listingName: string;
  listingVisible: boolean;
  acceptingOffers: boolean;
  buyerName: string;
  message: string;
  amount: number | null;
  status: 'Pending' | 'Replied' | 'Accepted' | 'Rejected';
  response: string;
  respondedAt: string | null;
  readAt: string | null;
  createdAt: string;
};

export type Market = { items: Listing[]; total: number; page: number };
export type Activity = {
  profile: Seller | null;
  listings: Listing[];
  received: Enquiry[];
  sent: Enquiry[];
  favorites: Listing[];
  unread: number;
};

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
    .replace(/\.00$/, '');

export function listingPrice(listing: Pick<Listing, 'type' | 'price'>) {
  if (listing.type === 'Free') return 'Free';
  if (listing.type === 'Exchange') return 'Open to exchange';
  return formatPrice(listing.price);
}

export function listingStatus(listing: Listing) {
  if (listing.deleted) return 'Deleted';
  if (!listing.active) return 'Inactive';
  return listing.status;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    .format(new Date(date));
}
