# Event Image + Quantity + Admin Delete — Implementation Plan

**Goal:** Render cover image di semua card + detail, admin bisa delete event + cleanup Cloudinary, user bisa beli >1 tiket.

**Order:** Types → Card image → Detail image → Admin delete → Quantity → Verify

---

## Task 1: Update Event type + API response

**Files:**
- `client/src/types.ts` — tambah `imageUrl: string`, `imagePublicId?: string`
- `server/src/routes/events.ts` — pastikan GET `/` dan GET `/:id` return `imageUrl` + `imagePublicId`

**Steps:**
1. Add `imageUrl: string` and `imagePublicId?: string` to `Event` interface
2. Verify `formattedEvents` di GET `/` already spreads `...event` (includes new fields)
3. Verify `formattedEvent` di GET `/:id` already spreads `...event` (includes new fields)

---

## Task 2: Render cover image in EventCatalog cards

**Files:**
- `client/src/components/features/event/EventCatalog.tsx`

**Steps:**
1. Replace `<div className="h-2" style={{ backgroundColor: accent }} />` with image block:
```tsx
{ev.imageUrl ? (
  <img src={ev.imageUrl} alt={ev.name} className="h-40 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
) : (
  <div className="h-2" style={{ backgroundColor: accent }} />
)}
```
2. Keep fallback: if image errors, hide it → accent bar shows.
3. Both grid and list view get image.

---

## Task 3: Render cover image in EventDetailsModal

**Files:**
- `client/src/components/modals/EventDetailsModal.tsx`

**Steps:**
1. Add cover image at top of left panel (md:col-span-7):
```tsx
{selectedEvent.imageUrl && (
  <div className="-mx-6 -mt-6 mb-4">
    <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="w-full h-48 object-cover" />
  </div>
)}
```
2. Replace the accent bar `<div className="h-2 -mx-6 -mt-6 mb-4 bg-[#FF6B9D]" />` if no image.

---

## Task 4: Admin-only delete + Cloudinary cleanup

**Files:**
- `server/src/routes/events.ts`
- `client/src/components/features/event/EventCatalog.tsx`

**Steps:**
1. Import `authorizeRoles` from `../middlewares/auth.middleware.ts`
2. Import `deleteImage` from `../utils/cloudinary.js`
3. Change delete route to:
```ts
eventsRouter.delete('/:id', verifyToken, authorizeRoles('Admin'), async (req, res) => { ... })
```
4. Inside delete handler, before DB delete, if `event.imagePublicId` exists: `await deleteImage(event.imagePublicId).catch(() => {})`
5. In `EventCatalog.tsx`, show delete button only for Admin:
```tsx
{currentUser && currentUser.role === 'Admin' && (
  <button onClick={(e) => onDeleteEvent(ev.id, ev.name, e)} ...>🗑️</button>
)}
```
Also keep existing Organizer-only edit button.

---

## Task 5: Quantity tiket di checkout

**Files:**
- `client/src/App.tsx` — add `quantity` state, update `getCheckoutPricing`, update `executeBooking`
- `server/src/routes/transactions.ts` — accept `quantity`, decrement seats by quantity, create BookingItem

**Steps:**
1. Add `quantity` state (default 1, clamp 1..availableSeats)
2. Add stepper in `EventDetailsModal.tsx` (Ticket Checkout section)
3. Update `getCheckoutPricing`: `orig = selectedEvent.price * quantity`
4. Update `executeBooking` body: include `quantity`
5. Backend: accept `quantity`, validate, `decrement: quantity`, create `BookingItem`:
```ts
await tx.bookingItem.create({
  data: {
    bookingId: booking.id,
    ticketTypeId: event.ticketTypes[0]?.id,
    quantity,
    pricePerItem: finalPrice / quantity,
    subtotal: finalPrice,
  }
});
```
6. Update button text: `Confirm & Purchase {quantity} Ticket{s}`

---

## Task 6: Verify

Run:
```bash
npm run lint
npm run build
```

Then manual browser test: check images render, admin delete works, quantity booking works.