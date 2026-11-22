import mongoose, { type ClientSession, type PipelineStage } from 'mongoose';
import sharp from 'sharp';
import type { z } from 'zod';
import { MAX_PHOTO_BYTES, MAX_PHOTOS, PAGE_SIZE, type Activity, type Enquiry, type Listing, type Market, type Seller } from '@/lib/catalog';
import { connectDB } from './db';
import { Enquiries, Favorites, Listings, Photos, Sellers, type EnquiryRecord, type ListingRecord, type SellerRecord } from './models';
import type { enquirySchema, listingSchema, listingStateSchema, responseSchema, searchSchema, sellerSchema } from './validation';

export class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export const available = { active: true, status: 'Available', deletedAt: null } as const;

function asSeller(seller: SellerRecord): Seller {
  return {
    id: String(seller._id), name: seller.name, campus: seller.campus, bio: seller.bio,
    contact: seller.contact, createdAt: seller.createdAt.toISOString(),
  };
}

function asListing(listing: ListingRecord): Listing {
  const id = String(listing._id);
  return {
    id, sellerId: String(listing.seller), name: listing.name, description: listing.description,
    price: listing.price, category: listing.category, condition: listing.condition, type: listing.type,
    status: listing.status, active: listing.active, deleted: Boolean(listing.deletedAt),
    photos: listing.photos.map((photo) => photo.startsWith('/') ? photo : '/api/listings/' + id + '/photos/' + photo),
    campus: listing.campus, createdAt: listing.createdAt.toISOString(),
  };
}

function asEnquiry(enquiry: EnquiryRecord, listing?: ListingRecord, owner = false): Enquiry {
  return {
    id: String(enquiry._id), listingId: String(enquiry.listing),
    listingName: enquiry.listingName,
    listingVisible: Boolean(listing && !listing.deletedAt && (listing.active || owner)),
    acceptingOffers: Boolean(listing?.active && !listing.deletedAt && listing.type === 'For Sale' && listing.status === 'Available'),
    buyerName: enquiry.buyerName, message: enquiry.message, amount: enquiry.amount,
    status: enquiry.status, response: enquiry.response, respondedAt: enquiry.respondedAt?.toISOString() ?? null,
    readAt: enquiry.readAt?.toISOString() ?? null, createdAt: enquiry.createdAt.toISOString(),
  };
}

export async function marketplace(query: z.infer<typeof searchSchema>): Promise<Market> {
  await connectDB();
  const filter: Record<string, unknown> = { ...available };
  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.min !== undefined || query.max !== undefined) {
    filter.type = { $ne: 'Exchange' };
    filter.price = {
      ...(query.min === undefined ? {} : { $gte: query.min }),
      ...(query.max === undefined ? {} : { $lte: query.max }),
    };
  }

  const words = [...new Set(query.q.split(/\s+/).filter(Boolean))].map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length) {
    filter.$and = words.map((word) => ({
      $or: [{ name: { $regex: word, $options: 'i' } }, { description: { $regex: word, $options: 'i' } }],
    }));
  }
  const newest = { createdAt: -1, _id: -1 } as const;
  let sort: Record<string, 1 | -1> = newest;
  const stages: PipelineStage[] = [{ $match: filter }];
  if (query.sort === 'price-low' || query.sort === 'price-high') {
    sort = { price: query.sort === 'price-low' ? 1 : -1, ...newest };
  }
  if (query.sort === 'relevance' && words.length) {
    const relevance = words.flatMap((word) => [
      { $cond: [{ $regexMatch: { input: '$name', regex: word, options: 'i' } }, 5, 0] },
      { $cond: [{ $regexMatch: { input: '$description', regex: word, options: 'i' } }, 1, 0] },
    ]);
    stages.push({ $addFields: { relevance: { $add: relevance } } });
    sort = { relevance: -1, ...newest };
  }
  const [result] = await Listings.aggregate<{ items: ListingRecord[]; count: { total: number }[] }>([
    ...stages,
    { $facet: {
      items: [{ $sort: sort }, { $skip: (query.page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
      count: [{ $count: 'total' }],
    } },
  ]);
  return { items: result.items.map(asListing), total: result.count[0]?.total ?? 0, page: query.page };
}

export async function listingDetails(id: string, visitor?: string) {
  await connectDB();
  const listing = await Listings.findOne({ _id: id, deletedAt: null }).lean();
  if (!listing) return null;
  const seller = await Sellers.findById(listing.seller).lean();
  if (!seller || (!listing.active && visitor !== seller.visitor)) return null;
  const similar = await Listings.find({
    ...available, category: listing.category, _id: { $ne: listing._id },
  }).sort({ createdAt: -1 }).limit(4).lean();
  return { listing: asListing(listing), seller: asSeller(seller), similar: similar.map(asListing), isOwner: visitor === seller.visitor };
}

export async function sellerDetails(id: string) {
  await connectDB();
  const seller = await Sellers.findById(id).lean();
  if (!seller) return null;
  const rows = await Listings.find({
    seller: seller._id, deletedAt: null, $or: [{ active: true }, { status: 'Sold' }],
  }).sort({ createdAt: -1 }).lean();
  return {
    seller: asSeller(seller),
    current: rows.filter((row) => row.status !== 'Sold').map(asListing),
    history: rows.filter((row) => row.status === 'Sold').map(asListing),
  };
}

export async function activity(visitor: string): Promise<Activity> {
  await connectDB();
  const [seller, sent, saved] = await Promise.all([
    Sellers.findOne({ visitor }).lean(),
    Enquiries.find({ visitor }).sort({ createdAt: -1 }).lean(),
    Favorites.find({ visitor }).sort({ createdAt: -1 }).lean(),
  ]);
  const newest = { createdAt: -1 } as const;
  const [listings, received] = seller ? await Promise.all([
    Listings.find({ seller: seller._id }).sort(newest).lean(),
    Enquiries.find({ seller: seller._id }).sort(newest).lean(),
  ]) : [[], []];
  const ids = [...sent.map((row) => row.listing), ...saved.map((row) => row.listing)];
  const otherListings = ids.length ? await Listings.find({ _id: { $in: ids } }).lean() : [];
  const lookup = new Map([...listings, ...otherListings].map((row) => [String(row._id), row]));
  return {
    profile: seller ? asSeller(seller) : null,
    listings: listings.map(asListing),
    received: received.map((row) => asEnquiry(row, lookup.get(String(row.listing)), true)),
    sent: sent.map((row) => asEnquiry(row, lookup.get(String(row.listing)))),
    favorites: saved.flatMap((row) => {
      const listing = lookup.get(String(row.listing));
      if (!listing) return [];
      const visible = asListing(listing);
      if (!listing.active) { visible.description = ''; visible.photos = []; }
      return [visible];
    }),
    unread: sent.filter((row) => row.respondedAt && !row.readAt).length,
  };
}

export async function preparePhotos(files: File[]) {
  if (files.length > MAX_PHOTOS) throw new RequestError('Upload up to three photos.');
  return Promise.all(files.map(async (file) => {
    if (file.size > MAX_PHOTO_BYTES || file.size === 0) throw new RequestError('Each photo must be under 950 KB.');
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 30_000_000 });
      const { format } = await image.metadata();
      if (format !== 'jpeg' && format !== 'png' && format !== 'webp') throw new Error('Unsupported photo');
      return await image.rotate().resize(1440, 1440, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch {
      throw new RequestError('Choose valid JPEG, PNG, or WebP photos.');
    }
  }));
}

export async function getPhoto(listing: string, photo: string, visitor?: string) {
  await connectDB();
  const parent = await Listings.findOne({ _id: listing, deletedAt: null, photos: photo }).select('active seller').lean();
  if (!parent || (!parent.active && (!visitor || !await Sellers.exists({ _id: parent.seller, visitor })))) return null;
  return await Photos.findOne({ _id: photo, listing });
}

async function inTransaction<T>(callback: (session: ClientSession) => Promise<T>) {
  await connectDB();
  await Promise.all([Sellers.init(), Listings.init(), Photos.init(), Enquiries.init()]);
  return mongoose.connection.transaction(callback);
}

async function ownListing(id: string, visitor: string, session: ClientSession) {
  const seller = await Sellers.findOne({ visitor }).session(session);
  if (!seller) throw new RequestError('Listing not found on this device.', 404);
  const listing = await Listings.findOne({ _id: id, seller: seller._id, deletedAt: null }).session(session);
  if (!listing) throw new RequestError('Listing not found on this device.', 404);
  return listing;
}

export async function saveListing(
  visitor: string,
  data: z.infer<typeof listingSchema>,
  uploads: Buffer[],
  id?: string,
) {
  const { profile, keepPhotos, ...fields } = data;
  return inTransaction(async (session) => {
    let listing;
    if (id) {
      listing = await ownListing(id, visitor, session);
    } else {
      let seller = await Sellers.findOne({ visitor }).session(session);
      if (!seller) {
        if (!profile) throw new RequestError('Complete your seller profile before publishing.');
        [seller] = await Sellers.create([{ ...profile, visitor }], { session });
      }
      listing = new Listings({ seller: seller._id, campus: seller.campus });
    }
    const retained = [...new Set(keepPhotos)];
    if (retained.some((photo) => !listing.photos.includes(photo))) throw new RequestError('A photo changed. Reload the listing and try again.', 409);
    if (retained.length + uploads.length < 1 || retained.length + uploads.length > MAX_PHOTOS) {
      throw new RequestError('Add one to three product photos.');
    }
    const removed = listing.photos.filter((photo) => !photo.startsWith('/') && !retained.includes(photo));
    if (removed.length) await Photos.deleteMany({ listing: listing._id, _id: { $in: removed } }, { session });
    const photos = uploads.length ? await Photos.insertMany(
      uploads.map((buffer) => ({ listing: listing._id, data: buffer })), { session },
    ) : [];
    if (listing.type === 'For Sale' && fields.type !== 'For Sale') {
      await Enquiries.updateMany({ listing: listing._id, status: 'Pending', amount: { $ne: null } }, {
        $set: { status: 'Rejected', respondedAt: new Date(), response: 'The listing is no longer offered for sale.' },
      }, { session });
    }
    listing.set({ ...fields, photos: [...retained, ...photos.map((photo) => String(photo._id))] });
    await listing.save({ session });
    return asListing(listing);
  });
}

export async function changeListing(visitor: string, id: string, changes: z.infer<typeof listingStateSchema> | null) {
  return inTransaction(async (session) => {
    const listing = await ownListing(id, visitor, session);
    if (changes) {
      listing.set(changes);
      await listing.save({ session });
      return asListing(listing);
    }
    listing.set({ active: false, deletedAt: new Date(), photos: [] });
    await listing.save({ session });
    await Photos.deleteMany({ listing: listing._id }, { session });
    return asListing(listing);
  });
}

export async function sendEnquiry(visitor: string, id: string, data: z.infer<typeof enquirySchema>) {
  return inTransaction(async (session) => {
    const listing = await Listings.findOneAndUpdate(
      { _id: id, ...available }, { $inc: { revision: 1 } }, { session, timestamps: false },
    );
    if (!listing) throw new RequestError('This item is no longer taking enquiries.', 409);
    const seller = await Sellers.findById(listing.seller).session(session);
    if (!seller || seller.visitor === visitor) throw new RequestError('Choose a listing from another seller.');
    if (data.amount !== null && listing.type !== 'For Sale') throw new RequestError('Price offers are only available for sale listings.');
    const [row] = await Enquiries.create([{
      ...data, visitor, listing: listing._id, seller: listing.seller, listingName: listing.name,
    }], { session });
    return asEnquiry(row, listing);
  });
}

export async function respond(visitor: string, id: string, data: z.infer<typeof responseSchema>) {
  return inTransaction(async (session) => {
    const seller = await Sellers.findOne({ visitor }).session(session);
    if (!seller) throw new RequestError('Enquiry not found on this device.', 404);
    const enquiry = await Enquiries.findOne({ _id: id, seller: seller._id }).session(session);
    if (!enquiry) throw new RequestError('Enquiry not found on this device.', 404);
    if (enquiry.status !== 'Pending') throw new RequestError('This enquiry has already been resolved.', 409);
    if ((enquiry.amount === null) !== (data.status === 'Replied')) {
      throw new RequestError('Choose a response that matches the enquiry type.');
    }

    let listing = await Listings.findById(enquiry.listing).session(session);
    const respondedAt = new Date();
    if (data.status === 'Accepted') {
      listing = await Listings.findOneAndUpdate(
        { _id: enquiry.listing, ...available, type: 'For Sale' }, { $set: { status: 'Reserved' } },
        { session, returnDocument: 'after' },
      );
      if (!listing) throw new RequestError('Make this listing available before accepting an offer.', 409);
      await Enquiries.updateMany({
        _id: { $ne: enquiry._id }, listing: enquiry.listing, status: 'Pending', amount: { $ne: null },
      }, {
        $set: { status: 'Rejected', respondedAt, response: 'The seller accepted another offer.' },
      }, { session });
    }
    enquiry.set({ ...data, respondedAt });
    await enquiry.save({ session });
    return asEnquiry(enquiry, listing ?? undefined, true);
  });
}

export async function markRead(visitor: string) {
  await connectDB();
  await Enquiries.updateMany({ visitor, respondedAt: { $ne: null }, readAt: null }, { $set: { readAt: new Date() } });
}

export async function setFavorite(visitor: string, id: string, saved: boolean) {
  await connectDB();
  if (!saved) {
    await Favorites.deleteOne({ visitor, listing: id });
    return;
  }
  if (!await Listings.exists({ _id: id, ...available })) throw new RequestError('This listing is no longer available to save.', 409);
  await Favorites.init();
  try {
    await Favorites.updateOne({ visitor, listing: id }, { $setOnInsert: { visitor, listing: id } }, { upsert: true });
  } catch (error) {
    if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 11000) throw error;
  }
}

export async function saveSeller(visitor: string, profile: z.infer<typeof sellerSchema>) {
  return inTransaction(async (session) => {
    const seller = await Sellers.findOneAndUpdate({ visitor }, { $set: profile }, {
      upsert: true, returnDocument: 'after', session,
    });
    await Listings.updateMany({ seller: seller._id, deletedAt: null }, { $set: { campus: profile.campus } }, { session });
    return asSeller(seller);
  });
}
