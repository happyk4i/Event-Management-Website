export function ExpiredBanner() {
  return (
    <div role="alert" className="bg-[#FEE2E2] border-2 border-[#DC2626] p-4 space-y-2">
      <p className="font-bold text-[#991B1B] text-sm">Batas upload pembayaran terlewati. Booking dibatalkan.</p>
    </div>
  );
}
