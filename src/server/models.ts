import { Schema, models, model, type Model, type Types } from 'mongoose';
import { CATEGORIES, CONDITIONS, CONTACT_METHODS, STATUSES, TYPES } from '@/lib/catalog';

type Stamped = { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

export type SellerRecord = Stamped & {
  visitor: string;
  name: string;
  campus: string;
  bio: string;
  contact: (typeof CONTACT_METHODS)[number];
};

export type ListingRecord = Stamped & {
  seller: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: (typeof CATEGORIES)[number];
  condition: (typeof CONDITIONS)[number];
  type: (typeof TYPES)[number];
  status: (typeof STATUSES)[number];
  active: boolean;
  deletedAt: Date | null;
  photos: string[];
  campus: string;
  revision: number;
};

export type EnquiryRecord = Stamped & {
  listing: Types.ObjectId;
  seller: Types.ObjectId;
  visitor: string;
  listingName: string;
  buyerName: string;
  message: string;
  amount: number | null;
  status: 'Pending' | 'Replied' | 'Accepted' | 'Rejected';
  response: string;
  respondedAt: Date | null;
  readAt: Date | null;
};

type FavoriteRecord = Stamped & { visitor: string; listing: Types.ObjectId };
type PhotoRecord = { _id: Types.ObjectId; listing: Types.ObjectId; data: Buffer };

const sellerSchema = new Schema<SellerRecord>({
  visitor: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  campus: { type: String, required: true },
  bio: { type: String, default: '' },
  contact: { type: String, enum: CONTACT_METHODS, required: true },
}, { timestamps: true });

const listingSchema = new Schema<ListingRecord>({
  seller: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: CATEGORIES, required: true },
  condition: { type: String, enum: CONDITIONS, required: true },
  type: { type: String, enum: TYPES, required: true },
  status: { type: String, enum: STATUSES, default: 'Available' },
  active: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  photos: { type: [String], required: true },
  campus: { type: String, required: true },
  revision: { type: Number, default: 0 },
}, { timestamps: true });
listingSchema.index({ active: 1, status: 1, deletedAt: 1, createdAt: -1 });
listingSchema.index({ active: 1, status: 1, deletedAt: 1, category: 1, createdAt: -1 });
listingSchema.index({ seller: 1, createdAt: -1 });

const enquirySchema = new Schema<EnquiryRecord>({
  listing: { type: Schema.Types.ObjectId, required: true },
  seller: { type: Schema.Types.ObjectId, required: true },
  visitor: { type: String, required: true },
  listingName: { type: String, required: true },
  buyerName: { type: String, required: true },
  message: { type: String, required: true },
  amount: { type: Number, default: null, min: 0 },
  status: { type: String, enum: ['Pending', 'Replied', 'Accepted', 'Rejected'], default: 'Pending' },
  response: { type: String, default: '' },
  respondedAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });
enquirySchema.index({ seller: 1, createdAt: -1 });
enquirySchema.index({ visitor: 1, createdAt: -1 });
enquirySchema.index({ listing: 1, status: 1, amount: 1 });

const favoriteSchema = new Schema<FavoriteRecord>({
  visitor: { type: String, required: true },
  listing: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });
favoriteSchema.index({ visitor: 1, listing: 1 }, { unique: true });
favoriteSchema.index({ visitor: 1, createdAt: -1 });

const photoSchema = new Schema<PhotoRecord>({
  listing: { type: Schema.Types.ObjectId, required: true, index: true },
  data: { type: Buffer, required: true },
});

export const Sellers = (models.Seller as Model<SellerRecord>) || model('Seller', sellerSchema);
export const Listings = (models.Listing as Model<ListingRecord>) || model('Listing', listingSchema);
export const Enquiries = (models.Enquiry as Model<EnquiryRecord>) || model('Enquiry', enquirySchema);
export const Favorites = (models.Favorite as Model<FavoriteRecord>) || model('Favorite', favoriteSchema);
export const Photos = (models.Photo as Model<PhotoRecord>) || model('Photo', photoSchema);
