# Pasta House Fullstack App

Pasta House is now wired as a fullstack ordering app with:

- Node/Express API in `server/`
- MongoDB/Mongoose models for products, orders, customers, payments, and admins
- Paystack checkout with verification and webhook handling
- Customer signup/login/account pages
- Admin dashboard for products, availability scheduling, and order status updates
- WhatsApp kept as a fallback/contact path

## Local Setup

1. Install backend dependencies:

   ```bash
   cd server
   npm install
   ```

2. Update `server/.env`:

   - Set `MONGODB_URI`
   - Replace `JWT_SECRET` and `CUSTOMER_JWT_SECRET` with strong values
   - Change `ADMIN_USERNAME` and `ADMIN_PASSWORD`
   - Confirm the Paystack test keys are correct

3. Seed products and the first admin:

   ```bash
   npm run seed
   ```

4. Start the backend:

   ```bash
   npm run dev
   ```

5. Serve the frontend with any static server. The default frontend API URL is in `config.js`:

   ```js
   window.PH_CONFIG.API_BASE = "http://localhost:5000/api";
   ```

## Admin

Open `admin/login.html` and log in with the admin values from `server/.env` after running the seed script.

## Deployment Notes

- Backend: Render Node service
- Frontend: Netlify/static hosting
- Database: MongoDB Atlas
- Paystack webhook: `https://<backend-url>/api/payments/webhook`
- Before deploying frontend, update `config.js` to your Render API URL.
