# SafeRoute BD — Backend Setup Guide

## Quick Start (3 steps)

### Step 1 — Add your MongoDB URI to .env

Open `Backend/.env` and replace the `MONGO_URI` line:

```
MONGO_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxxxx.mongodb.net/saferoute
```

Get this from [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → Connect → Drivers.

### Step 2 — Install dependencies

```bash
cd Backend
npm install
```

### Step 3 — Run the server

```bash
npm run dev
```

You should see:
```
MongoDB connected
42 Bangladeshi vehicles seeded successfully.
Server running on port 5000
```

---

## Common Errors

| Error | Fix |
|---|---|
| `uri parameter must be a string, got undefined` | You haven't set `MONGO_URI` in `.env` |
| `nodemon is not recognized` | Run `npm install` first, then `npm run dev` |
| `CloudinaryStorage` import error | Already fixed — cloudinary is now optional |
| Port already in use | Change `PORT=5000` in `.env` to another number |

---

## Notes
- Photo uploads save to `Backend/uploads/` locally (no Cloudinary account needed for dev).
- The 42 Bangladeshi vehicles seed automatically on first run.
- Frontend runs separately: `cd Frontend && npm install && npm run dev`
