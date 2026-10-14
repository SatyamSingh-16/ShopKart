# ShopKart Labs 01–06 — Viva Guide for This Exact Codebase

This guide explains the code that is actually present in this project. Do not memorize sentences blindly; follow each request flow in VS Code.

## 1. Architecture

There are three runtime layers:

```text
React (localhost:5173)
        ↓ HTTP /api/* through Vite proxy
Express (localhost:3000)
        ↓ Mongoose
MongoDB (shopkart database)
```

React handles UI and client state. Express owns API/business rules. MongoDB stores persistent customers, products and orders.

### Why Vite proxy?

Frontend code calls `/api/customers/login`, `/api/cart`, etc. Vite forwards `/api/*` to Express and removes `/api`. Therefore Express still exposes the exact lab endpoints like `/cart` and `/orders`.

## 2. Backend entry point — `backend/index.js`

- `express.json()` parses JSON into `req.body`.
- `cookieParser()` makes cookies available as `req.cookies`.
- `app.use('/customers', customerRoutes)` mounts authentication routes.
- Similar mounts exist for products, wishlist, cart and orders.
- MongoDB connects before `app.listen()`, so the API is not considered ready without its database.
- Unknown routes return JSON `404`.
- Invalid JSON returns `400` rather than an HTML error.

## 3. Customer model — `models/customer.model.js`

The same model now supports three lab phases:

```text
Authentication fields:
fullName, email, password, phone

Lab 04:
wishlist: [Product ObjectId]

Lab 05:
cart: [{ product: Product ObjectId, quantity }]
```

### Why wishlist stores only ObjectIds

Wishlist is a relationship to the Product source of truth. If a Product's price changes, wishlist does not contain a stale copied price. `populate()` retrieves current data.

### Why cart is different

Cart must know *which product* and *how many*. Therefore each cart entry contains a Product reference and quantity.

### Why subtotal is not stored

Subtotal is derived data:

```text
Σ(current product price × cart quantity)
```

Storing subtotal separately could become stale.

## 4. Authentication

### Registration

`POST /customers/register`

1. Validate fields.
2. Normalize email.
3. Reject duplicate email.
4. `bcrypt.hash(password, 10)`.
5. Store only hash.
6. Return safe customer fields without password/hash.

### Login

`POST /customers/login`

1. Find customer by normalized email.
2. `bcrypt.compare(plainPassword, storedHash)`.
3. If valid, sign JWT containing `customerId`.
4. Put JWT in HttpOnly cookie.

JWT is **signed**, not encrypted. Its payload is not a suitable place for secrets such as passwords.

### Auth middleware

`middlewares/auth.middleware.js`:

```text
req.cookies.token
    ↓
jwt.verify(token, JWT_SECRET)
    ↓
decoded.customerId
    ↓
Customer.findById(...).select('-password')
    ↓
req.user = customer
    ↓
next()
```

Protected controllers use `req.user._id`. They never trust a customer ID sent by the browser.

## 5. Product catalogue

`Product` has name, description, price, category, image and stock.

`GET /products` builds a MongoDB filter dynamically from query parameters:

```text
?search=keyboard
?category=Electronics
?search=keyboard&category=Electronics
?sort=price_asc
```

Search uses case-insensitive `$regex`. `escapeRegex()` treats characters such as `[` literally rather than letting user input become regex syntax.

`GET /products/:id` uses a **path parameter** because it identifies one resource. Search/category use **query parameters** because they filter a collection.

## 6. Wishlist — Lab 04

### Add

`POST /wishlist/:productId`

1. Auth middleware identifies current customer.
2. Validate ObjectId.
3. Ensure Product exists.
4. Check current customer's wishlist for duplicate.
5. Duplicate → `409 Conflict`.
6. Push Product ObjectId and save Customer.

### Get

`GET /wishlist`

The controller performs:

```js
.populate({
  path: 'wishlist',
  select: 'name price category image stock'
})
```

MongoDB stores IDs, while the API returns useful Product data.

### Remove

`DELETE /wishlist/:productId`

The controller removes only from the authenticated customer's wishlist. There is intentionally no `/wishlist/:userId` endpoint.

## 7. Cart — Lab 05

### Add

`POST /cart/:productId`

- New product → quantity 1.
- Existing product → quantity +1.
- New quantity cannot exceed current Product stock.

### Get

`GET /cart`

The Product reference is populated so React gets current name/price/image/stock. A deleted Product is represented as unavailable so the user can remove it.

### Update quantity

`PATCH /cart/:productId`

Body:

```json
{ "quantity": 3 }
```

Server checks integer, minimum 1, product existence, cart membership, and latest stock.

### Remove

`DELETE /cart/:productId`

Removes the row and returns the updated cart.

## 8. Why React Context is used

`frontend/src/context/CartContext.jsx` is the single shared frontend source of cart state.

It owns:

```text
cartItems
loading
error
busy action per product
refreshCart()
addToCart()
updateQuantity()
removeFromCart()
clearLocalCart()
```

It also derives:

```text
totalUnits
subtotal
```

### Why not fetch independently in Navbar and Cart page?

Independent copies can disagree. Example: Navbar says `Cart (2)` while Cart page says three units. Context lets a successful mutation update one shared state and every consumer re-renders from that state.

### Server state vs frontend state

MongoDB cart is persistent server state. Context is the frontend's current synchronized representation of that server state.

## 9. React ProtectedRoute

`ProtectedRoute.jsx` calls `/customers/me` when the protected shell mounts.

Why not just store `isLoggedIn = true`?

Because a JavaScript variable can be stale or manually changed. `/customers/me` makes the backend verify the HttpOnly JWT cookie.

After authentication succeeds, ProtectedRoute wraps Navbar + child pages in `CartProvider`.

## 10. Product cards

`ProductCard.jsx` performs two mutations:

- Wishlist add is feature-local state because Lab 04 intentionally does not require global wishlist state.
- Add to cart uses shared `CartContext` because Lab 05 requires the cart to update across the application.

Buttons disable during an in-progress request to avoid duplicate clicks.

## 11. Cart page

`Cart.jsx` reads the global cart state.

`CartItem.jsx` has `−` and `+` controls:

- never below 1,
- never above stock,
- backend validates again even though buttons are disabled client-side.

Client validation improves UX; server validation provides correctness/security.

## 12. Order model — why it snapshots Product data

Cart stores a live Product reference because the user has not purchased yet.

Order stores both a Product reference and purchase-time snapshots:

```text
name
price
quantity
image
```

If Keyboard is ₹2,999 today and ₹3,499 next month, the old order still shows ₹2,999.

Order also stores:

```text
shippingAddress
totalAmount
paymentStatus
status
razorpayOrderId
razorpayPaymentId
createdAt / updatedAt
```

## 13. Checkout client validation

`Checkout.jsx` collects:

- full name
- phone
- address line
- city
- state
- 6-digit pincode

Whitespace-only fields fail. Basic invalid data is stopped before an API call, but backend validation still repeats the important checks.

## 14. `POST /orders/create-payment-order`

React sends **only** shipping address.

The backend does not accept trusted order items or trusted total from React.

Exact flow:

```text
JWT customer
  ↓
load Customer.cart
  ↓
reject empty cart
  ↓
load latest Product documents
  ↓
ensure every Product still exists
  ↓
re-check stock
  ↓
calculate total on server
  ↓
build purchase snapshot
  ↓
create ShopKart PENDING_PAYMENT order
  ↓
create Razorpay Order in paise
  ↓
save Razorpay order ID
  ↓
return ShopKart order ID + Razorpay order ID + amount + currency + Key ID
```

### Why multiply by 100?

Razorpay uses the smallest currency unit. ₹1 becomes 100 paise.

### Why Key ID may go to React but Key Secret may not

Key ID identifies the merchant integration and is required by Checkout. Key Secret authenticates/signs server-side operations and must remain private.

## 15. Razorpay browser flow

`Checkout.jsx` loads:

```text
https://checkout.razorpay.com/v1/checkout.js
```

It opens Standard Checkout with the Razorpay Order ID created by the backend.

The `handler(response)` callback receives:

```text
razorpay_order_id
razorpay_payment_id
razorpay_signature
```

The callback does **not** directly declare the ShopKart order paid. It sends these values to the backend.

## 16. `POST /orders/verify-payment`

Backend loads the ShopKart order using:

```text
order _id + authenticated customer _id
```

It checks the supplied Razorpay order ID equals the trusted one stored in MongoDB.

Then it computes:

```text
HMAC-SHA256(
  storedRazorpayOrderId + "|" + razorpayPaymentId,
  RAZORPAY_KEY_SECRET
)
```

The expected signature is compared with Razorpay's supplied signature.

Only after successful verification:

```text
paymentStatus = PAID
status = PLACED
razorpayPaymentId saved
cart cleared in MongoDB
frontend Context cart cleared
```

### Why browser `paymentSuccess: true` would be insecure

A user controls their browser and can modify JavaScript requests. The backend needs cryptographic evidence produced with the secret shared with Razorpay.

## 17. Why the cart is not cleared early

These events are **not enough**:

- clicking Proceed to Checkout,
- creating a pending ShopKart order,
- creating a Razorpay order,
- opening the Razorpay modal,
- receiving an unverified browser callback.

Cart clears only after signature verification succeeds. On failure/dismissal, the customer can retry without rebuilding their cart.

## 18. Orders APIs

### `GET /orders`

Filters by `user: req.user._id` and sorts newest first.

### `GET /orders/:id`

Uses both identifiers in one query:

```js
Order.findOne({ _id: id, user: req.user._id })
```

Therefore guessing another customer's valid order ID does not return their order.

## 19. Order pages

`Orders.jsx` handles loading/error/empty/success and renders `OrderCard` components.

`OrderDetails.jsx` displays historical snapshot prices and shipping/payment information.

`OrderSuccess.jsx` is shown only after backend payment verification returned success. It fetches the saved order again rather than relying only on temporary browser state.

## 20. HTTP status codes used

```text
200 OK                successful reads/updates/login/logout
201 Created           registration/product/wishlist/order creation
400 Bad Request       malformed ID/body/business validation
401 Unauthorized      missing/invalid authentication
404 Not Found         missing resource or order not owned
409 Conflict          duplicate wishlist/email
500 Internal Error    unexpected server failure
502 Bad Gateway       Razorpay order creation/service failure
503 Service Unavailable Razorpay Test credentials not configured
```

## 21. Files the TA may point at

### `services/api.js`
Centralizes Axios calls. `baseURL: '/api'` works because Vite proxies to port 3000. `withCredentials: true` supports cookie credentials.

### `App.jsx`
Maps browser URLs to pages. Protected routes are nested under `ProtectedRoute`.

### `useState`
Stores changing local UI data such as forms, loading and errors.

### `useEffect`
Used for side effects such as fetching products/wishlist/orders after a component mounts or filters change.

### controlled input
`value={state}` + `onChange={...}` means React state is the source of truth for the input.

### `.map()`
Transforms fetched arrays into React component lists. Stable MongoDB `_id` values are used as React keys.

### `AbortController`
Cancels obsolete GET requests when a component unmounts or a newer search/details request replaces an older request.

## 22. High-probability viva questions

1. Why wishlist ObjectIds instead of full Product objects?
2. What does Mongoose `populate()` do?
3. Why does cart need quantity but wishlist does not?
4. Why use Context for cart but not wishlist?
5. Why is subtotal derived instead of stored?
6. How does Navbar cart count update without refresh?
7. Why validate stock both during cart update and checkout?
8. Why send only shipping address during checkout?
9. Why does Order snapshot product name/price?
10. Why is total calculated on backend?
11. Why is Razorpay amount in paise?
12. Why is the Key Secret backend-only?
13. Why isn't Razorpay's browser callback automatically trusted?
14. How is the HMAC signature generated?
15. Why use the Razorpay Order ID stored in MongoDB during verification?
16. When exactly is the cart cleared?
17. What happens if the payment fails?
18. How does `/orders/:id` enforce ownership?
19. Authentication vs authorization?
20. HttpOnly cookie purpose?

## 23. One-minute explanation of the whole project

> ShopKart is a React + Express + MongoDB application. Customers register with bcrypt-hashed passwords, log in, and receive a JWT in an HttpOnly cookie. Express authentication middleware verifies that cookie and attaches the current Customer to `req.user`. Products come dynamically from MongoDB and support search/filter/details. Wishlist stores Product ObjectId references and populates current product data. Cart stores Product reference plus quantity and is synchronized to one React Context so product cards, Navbar and Cart page share the same state. Checkout sends only shipping details; the server reloads the authenticated cart and latest Product data, verifies stock, calculates the total, snapshots purchase-time product information, creates a pending ShopKart order and a Razorpay Test Order in paise. React opens Razorpay Checkout, then sends Razorpay's payment identifiers and signature back to Express. Express verifies the HMAC signature using the secret key. Only then is the order marked PAID/PLACED and the cart cleared. Orders are fetched only for the authenticated customer.
