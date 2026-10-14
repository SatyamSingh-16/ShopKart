# ShopKart — Final Project (Engineering Labs 01–06)

**Developer:** Satyam Singh  

This is one continuous ShopKart MERN application covering the complete lab sequence:

1. Customer authentication
2. React login/register/protected home
3. Product catalogue and discovery
4. Wishlist
5. Shopping cart + global cart state
6. Razorpay Test Mode checkout + persistent orders

The project keeps the original Lab 01 `Customer` model name. Later lab sheets sometimes say “User model”; in this codebase, **Customer is that authenticated user model**.

## Final user journey

```text
Register / Login
      ↓
Products + Search + Filter
      ↓
Wishlist
      ↓
Cart + Quantity + Global State
      ↓
Checkout + Shipping Address
      ↓
Server Price/Stock Validation
      ↓
Pending ShopKart Order
      ↓
Razorpay Test Order
      ↓
Razorpay Checkout
      ↓
Backend HMAC Signature Verification
      ↓
PAID / PLACED Order
      ↓
Cart Cleared
      ↓
Order Confirmation + My Orders
```

## Requirements

- Node.js 20.19+ or Node 22+
- MongoDB Community Server running locally
- A Razorpay account in **Test Mode** for Lab 06
- Two terminal windows/tabs

## 1. Start MongoDB

On the Mac setup used for this project:

```sh
brew services start mongodb-community@8.0
```

## 2. Configure Razorpay Test Mode

The backend runs without Razorpay credentials, so Labs 01–05 can still be used. Lab 06 checkout will intentionally refuse to start until Test Mode keys are configured.

Create Test Mode API keys in Razorpay and edit `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Only a `rzp_test_...` Key ID is accepted by this lab project. **Never use live credentials or real money.**

The Key Secret stays on the backend. It is never returned to React.

## 3. Start backend

From the project root:

```sh
cd backend
npm install
npm run seed
npm start
```

Expected:

```text
MongoDB connected
Server running on http://localhost:3000
```

`npm run seed` inserts six sample products only when they are missing.

## 4. Start frontend

Open a second terminal from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The React app talks to Express through Vite's `/api` development proxy. Browser request `/api/cart` becomes backend request `/cart` on port 3000.

## Project structure

```text
shopkart-final/
├── backend/
│   ├── config/
│   │   └── razorpay.js
│   ├── controllers/
│   │   ├── customer.controller.js
│   │   ├── product.controller.js
│   │   ├── wishlist.controller.js
│   │   ├── cart.controller.js
│   │   └── order.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── product.model.js
│   │   └── order.model.js
│   ├── routes/
│   │   ├── customer.routes.js
│   │   ├── product.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── cart.routes.js
│   │   └── order.routes.js
│   ├── utils/generateToken.js
│   ├── seedProducts.js
│   ├── index.js
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/images/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CartItem.jsx
│   │   │   ├── CheckoutForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── OrderCard.jsx
│   │   │   ├── OrderSummary.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── WishlistCard.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetails.jsx
│   │   │   └── OrderSuccess.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── vite.config.js
│   └── package.json
├── VIVA_GUIDE.md
└── README.md
```

## Backend API map

| Method | Endpoint | Protected | Purpose |
|---|---|:---:|---|
| POST | `/customers/register` | No | Register customer |
| POST | `/customers/login` | No | Login + HttpOnly JWT cookie |
| GET | `/customers/me` | Yes | Current customer |
| POST | `/customers/logout` | Yes | Clear auth cookie |
| POST | `/products` | No | Create product (lab requirement) |
| GET | `/products` | No | List/search/filter/sort products |
| GET | `/products/:id` | No | Single product |
| POST | `/wishlist/:productId` | Yes | Add wishlist item |
| GET | `/wishlist` | Yes | Current customer's wishlist |
| DELETE | `/wishlist/:productId` | Yes | Remove wishlist item |
| POST | `/cart/:productId` | Yes | Add/increment cart product |
| GET | `/cart` | Yes | Current customer's populated cart |
| PATCH | `/cart/:productId` | Yes | Set quantity |
| DELETE | `/cart/:productId` | Yes | Remove cart product |
| POST | `/orders/create-payment-order` | Yes | Validate checkout, create pending order + Razorpay order |
| POST | `/orders/verify-payment` | Yes | Verify Razorpay signature, mark PAID/PLACED, clear cart |
| GET | `/orders` | Yes | Current customer's orders |
| GET | `/orders/:id` | Yes | One owned order only |

## Frontend routes

```text
/login
/register
/home
/products
/products/:id
/wishlist
/cart
/checkout
/orders
/orders/:id
/order-success/:id
```

Everything except login/register is behind the React `ProtectedRoute`. Sensitive API protection still happens independently on the backend using JWT middleware.

## Lab 04 behaviour

- Wishlist stores Product ObjectIds, not copied product objects.
- `populate()` loads current product information.
- Duplicate wishlist insertion returns `409`.
- Wishlist survives refresh/logout/login because MongoDB is the source of truth.
- Loading, empty, error and retry states are present.

## Lab 05 behaviour

- Cart entries store only Product reference + quantity.
- Adding the same product increments quantity rather than creating duplicate rows.
- Stock is validated on the backend.
- React Context is the one shared frontend cart state used by Product cards, Navbar, Cart and Checkout.
- Navbar count is total quantity, not number of distinct rows.
- Subtotal is derived from current product price × quantity; it is not stored in MongoDB.

## Lab 06 / Razorpay flow

The browser cannot declare payment success.

1. React sends only `shippingAddress` to `/orders/create-payment-order`.
2. Express loads the authenticated customer's cart.
3. Express reloads current Product documents, re-checks stock and calculates total itself.
4. Express creates a ShopKart order with purchase-time name/price/image snapshots.
5. Express creates a Razorpay Order in **paise** and returns only safe checkout data + Key ID.
6. React opens Razorpay Standard Checkout.
7. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to the callback.
8. React sends those values to `/orders/verify-payment`.
9. Express generates its own HMAC-SHA256 signature using the **stored** Razorpay Order ID and backend Key Secret.
10. Only a valid signature changes the order to `PAID` / `PLACED` and clears the cart.
11. React clears its Context cart state, so Navbar immediately becomes `Cart (0)`.

If checkout is dismissed, payment fails, signature verification fails, or order creation fails, the cart stays intact.

## Useful checks before viva/submission

### Backend syntax

```sh
cd backend
npm run check
```

### Frontend production build

```sh
cd frontend
npm run build
```

### Functional demo order

1. Register/login.
2. Search/filter products.
3. Add/remove wishlist items.
4. Add one product multiple times and show quantity increments.
5. Change quantity and show Navbar count + subtotal update without refresh.
6. Refresh browser and show cart still exists.
7. Open Checkout and show client validation.
8. Use Razorpay **Test Mode**.
9. Finish a test payment.
10. Show confirmation, `Cart (0)`, then My Orders.

## Important security points for viva

- Passwords are bcrypt hashes, never plaintext.
- JWT is signed, not encrypted.
- JWT lives in an HttpOnly cookie in this project.
- User/customer identity comes from verified JWT middleware, not a `userId` supplied by React.
- Wishlist/cart/order APIs are user-specific and protected.
- Frontend totals are never trusted at checkout.
- Razorpay Key Secret never enters frontend code or API responses.
- Payment callback is not trusted until backend signature verification succeeds.
- Single-order API queries by both order `_id` and authenticated customer ID.

Read `VIVA_GUIDE.md` before the TA viva.
