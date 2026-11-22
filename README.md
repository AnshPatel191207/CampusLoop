# Campus Loop

Campus Loop is a second-hand marketplace for students. Browse campus essentials, publish items for sale, give them away, or propose an exchange. Students can save listings and keep track of enquiries and offers in one dashboard.

## Run locally

Use Node.js 22.12 or later and a MongoDB replica set. MongoDB Atlas supports the transactions used for offer acceptance and photo updates.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to a connection string for Cluster0. In Atlas, use a database user with read/write access to `campus_loop_marketplace` and configure network access for the environments that run the app.
3. Run `npm run seed` if you want example listings. The seed adds fixed sample records to the dedicated database and leaves existing records intact.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

The application overrides any database name in the URI with `campus_loop_marketplace`. Keep the URI in server-side environment variables.

## Demonstrate the workflow

1. Publish a listing with a photo and fill in the seller profile when prompted.
2. Open another browser profile or a private window. Search for the listing, save it, send an enquiry, and submit a separate price offer.
3. Open **Received** in the seller dashboard to reply. Open **Pending offers** to accept or reject the offer. Acceptance reserves the listing and declines other pending offers for it.
4. Return to the buyer browser. New responses appear under the bell and in **Sent**. The saved listing also reflects its new availability.
5. Use **My listings** to edit, deactivate, reactivate, mark sold, or delete the listing. Deletion removes the listing from discovery and keeps previous enquiry records.

Activity belongs to a browser cookie. Use the same browser profile to recover the same listings, saved items, and enquiry history. The bell updates when the app regains focus and periodically while it is open.

## Structure

| Location | Purpose |
| --- | --- |
| `src/app` | Next.js pages and Route Handlers |
| `src/components` | Marketplace UI, listing forms, filters, and dashboard |
| `src/server` | Connection, Mongoose models, validation, and transactional marketplace workflows |
| `public/market` | Hero and example listing photos |

Discovery searches listing names and descriptions together. Relevance gives name matches greater weight. Price filters include free items when zero is in range and omit exchange listings, which have no numeric price. Uploaded JPEG, PNG, and WebP photos are converted to WebP and stored in MongoDB. The browser prepares them before upload and the API independently checks the files and size.

## Deploy on Vercel

Push the project to GitHub and import the repository into Vercel as a Next.js project. Select a supported Node.js version at or above 22.12 and set `MONGODB_URI` for each Vercel environment that should connect to the database. Configure Cluster0 network access for the deployment before running a live smoke test.

Run `npm run typecheck`, `npm run lint`, and `npm run build` before pushing. The build does not need the database connection. To seed Atlas, run `npm run seed` from an environment where the Cluster0 URI is configured and the network is allowed.
