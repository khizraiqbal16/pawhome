# PawHome - Pet Adoption Community Platform (MERN)

React (Vite) + Node.js + Express + MongoDB. Includes all required features and all bonus features.

## Folder structure
```
pet-adoption/
├── server/
│   ├── server.js            # Express + Socket.io entry
│   ├── seed.js              # Demo users and pets
│   ├── config/db.js
│   ├── models/              # User, Pet, AdoptionRequest, Message, Notification, Payment
│   ├── middleware/          # auth (JWT), upload (multer)
│   ├── routes/              # auth, pets, requests, messages, notifications, payments, geo
│   └── utils/               # geo (geocoding + distance), notify (save + realtime push)
└── client/
    └── src/
        ├── api.js
        ├── context/         # AuthContext (auth + socket + counters), ToastContext
        ├── components/      # Navbar, Footer, PetCard, ShareButtons, ProtectedRoute
        └── pages/           # Home, Pets, PetDetail, PetForm, Login, Register,
                             # Dashboard, Messages, Notifications, Donate, PaymentSuccess
```

## Run
1. Start MongoDB locally (or use a MongoDB Atlas URI).
2. Backend:
   ```
   cd server
   cp .env.example .env      # edit MONGO_URI and JWT_SECRET
   npm install
   npm run seed              # optional demo data
   npm run dev
   ```
3. Frontend (new terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5173
   Demo logins after seeding: demo@pawhome.com / password123 and adopter@pawhome.com / password123

## Requirement map
| Requirement | Where |
|---|---|
| Browse pets by species, breed, location | client/pages/Pets.jsx, server/routes/pets.js (GET /api/pets) |
| User authentication | routes/auth.js, AuthContext, ProtectedRoute |
| Pet profile page (details, images, status) | client/pages/PetDetail.jsx |
| RESTful API, CRUD for pets | routes/pets.js |
| Pets and users stored in MongoDB | models/Pet.js, models/User.js |
| Location-based service | utils/geo.js (OpenStreetMap geocoding), 2dsphere index, radius filter + "Near me" |
| Messaging between owners and adopters | routes/messages.js, pages/Messages.jsx (Socket.io live) |
| Bonus: payments | routes/payments.js, Donate.jsx, PetDetail (Stripe Checkout, demo mode without a key) |
| Bonus: notifications | routes/notifications.js, Navbar bell, Notifications.jsx (realtime) |
| Bonus: social sharing | components/ShareButtons.jsx (Facebook, X, WhatsApp, LinkedIn, copy link, native share) |

## Main API endpoints
- POST /api/auth/register, POST /api/auth/login, GET/PUT /api/auth/me
- GET /api/pets (q, species, breed, gender, size, city, lat, lng, radius, sort, page), GET /api/pets/:id
- POST /api/pets, PUT /api/pets/:id, DELETE /api/pets/:id, GET /api/pets/mine
- POST /api/requests/pet/:petId, GET /api/requests/mine?role=sent|received, PATCH /api/requests/:id
- GET /api/messages/conversations, GET /api/messages/thread/:userId, POST /api/messages
- GET /api/notifications, PATCH /api/notifications/read-all
- POST /api/payments/checkout, POST /api/payments/confirm
- GET /api/geo/geocode?q=Karachi

## Stripe (optional)
Put STRIPE_SECRET_KEY=sk_test_... in server/.env. Without it, payments run in demo mode (recorded, no real charge).
