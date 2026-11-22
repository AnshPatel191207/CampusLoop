import mongoose, { Types as MongoTypes } from 'mongoose';
import type { Listing } from '@/lib/catalog';
import { connectDB, DATABASE_NAME } from '@/server/db';
import { Listings, Sellers } from '@/server/models';

const sellers = [
  { name: 'Aisha Rao', campus: 'North Campus', bio: 'Passing on the books and tech that got me through first year.', contact: 'Campus meetup' },
  { name: 'Kabir Shah', campus: 'City Campus', bio: 'Usually around the library or student centre after class.', contact: 'In-app enquiries' },
  { name: 'Meera Iyer', campus: 'West Campus', bio: 'Making room for next semester and sharing what I no longer use.', contact: 'Campus meetup' },
] as const;

type DemoItem = Pick<Listing, 'name' | 'description' | 'category' | 'condition' | 'price' | 'type'> & {
  owner: number; photo: string; status?: Listing['status'];
};

const items: DemoItem[] = [
  { name: 'Computer Science Textbook Set', description: 'Three first-year computer science textbooks covering algorithms, programming, and discrete maths. A few notes in pencil and no missing pages.', category: 'Books', condition: 'Good', price: 850, type: 'For Sale', owner: 0, photo: 'textbooks' },
  { name: 'Wireless Over-Ear Headphones', description: 'Lightweight wireless headphones with soft ear cups. Includes a charging cable. Great for long study sessions in the library.', category: 'Electronics', condition: 'Like new', price: 2200, type: 'For Sale', owner: 1, photo: 'headphones' },
  { name: 'Compact Oak Study Desk', description: 'A small study desk for a hostel room or shared flat. The surface has minor marks. Please collect from West Campus.', category: 'Furniture', condition: 'Good', price: 1800, type: 'For Sale', owner: 2, photo: 'study-desk' },
  { name: 'Scientific Calculator', description: 'A reliable scientific calculator for engineering and maths classes. All buttons work, and the slide cover is included.', category: 'Electronics', condition: 'Good', price: 650, type: 'For Sale', owner: 0, photo: 'calculator' },
  { name: 'Spiral Notebooks & Pens', description: 'Two unopened notebooks and three pens left over from last semester. Happy to hand them off near the library.', category: 'Stationery', condition: 'Like new', price: 0, type: 'Free', owner: 1, photo: 'notebooks' },
  { name: 'Canvas Campus Backpack', description: 'An olive canvas backpack with an internal laptop sleeve. Interested in swapping it for a small duffel or messenger bag.', category: 'Other', condition: 'Fair', price: 0, type: 'Exchange', owner: 2, photo: 'backpack' },
  { name: 'Data Structures Study Bundle', description: 'Used textbooks and reference material for a second-year data structures course.', category: 'Books', condition: 'Well used', price: 450, type: 'For Sale', owner: 0, photo: 'textbooks', status: 'Sold' },
];

const stableId = (offset: number) => new MongoTypes.ObjectId('ca6f000000000000' + offset.toString(16).padStart(8, '0'));

async function seed() {
  await connectDB();
  await Promise.all([Sellers.init(), Listings.init()]);
  const now = Date.now();
  for (const [index, seller] of sellers.entries()) {
    await Sellers.updateOne({ _id: stableId(index + 1) }, { $setOnInsert: {
      ...seller, visitor: 'demo-seller-' + index, createdAt: new Date(now - 86_400_000 * 45), updatedAt: new Date(now),
    } }, { upsert: true, timestamps: false });
  }
  for (const [index, item] of items.entries()) {
    const { owner, photo, ...fields } = item;
    await Listings.updateOne({ _id: stableId(index + 100) }, { $setOnInsert: {
      ...fields, seller: stableId(owner + 1), campus: sellers[owner].campus, photos: ['/market/' + photo + '.webp'],
      createdAt: new Date(now - index * 3_600_000), updatedAt: new Date(now),
    } }, { upsert: true, timestamps: false });
  }
  console.log('Sample listings ready in ' + DATABASE_NAME + '.');
}

seed().catch((error: unknown) => {
  console.error('Seed failed. Check MONGODB_URI and database access.', error instanceof Error ? error.name : '');
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
