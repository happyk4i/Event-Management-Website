import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { verifyToken, authorizeRoles, AuthenticatedUser } from '../auth.middleware.js';

export const dashboardRouter = Router();

// Rute Agregasi Statistik: Hanya boleh diakses jika sudah LOGIN DAN berstatus 'Organizer'
dashboardRouter.get('/stats/:organizerId', verifyToken, authorizeRoles('Organizer'), async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;

    // Ambil data user hasil decode dari token via Type Assertion (as)
    const currentUser = (req as any).user as AuthenticatedUser | undefined;

    // Proteksi Ekstra: Cegah Organizer A mengintip data keuangan milik Organizer B
    if (currentUser?.id !== organizerId) {
      res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang melihat dashboard ini.' });
      return;
    }

    // 1. Ambil semua event yang dibuat oleh Organizer ini beserta transaksi penjualan tiketnya
    const organizerEvents = await prisma.event.findMany({
      where: { organizerId },
      include: {
        transactions: true // Menarik data riwayat pembelian tiket dari tabel Transaction
      }
    });

    // 2. Siapkan variabel penghitung statistik dasar
    let totalEvents = organizerEvents.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;

    // Objek penampung sementara untuk mengelompokkan omset bulanan
    const monthlyDataMap: { [key: string]: number } = {};

    // 3. Iterasi data dari Prisma untuk menghitung akumulasi omset keuangan
    organizerEvents.forEach(event => {
      // Hitung total tiket terjual berdasarkan kapasitas yang berkurang
      const ticketsFromCapacity = event.capacity - event.availableSeats;
      if (ticketsFromCapacity > 0) {
        totalTicketsSold += ticketsFromCapacity;
      }

      event.transactions.forEach(tx => {
        totalRevenue += tx.finalPrice;

        // Ekstrak tahun-bulan dari purchaseDate (Format string Anda: YYYY-MM-DD)
        // Contoh: "2026-07-15" dipotong menjadi "2026-07"
        if (tx.purchaseDate && tx.purchaseDate.length >= 7) {
          const yearMonth = tx.purchaseDate.substring(0, 7);
          monthlyDataMap[yearMonth] = (monthlyDataMap[yearMonth] || 0) + tx.finalPrice;
        }
      });
    });

    // 4. Ubah struktur peta bulanan menjadi bentuk Array Objek agar ramah dibaca oleh library grafik (Recharts)
    const chartData = Object.keys(monthlyDataMap)
      .sort() // Urutkan kronologis berdasarkan urutan bulan tertua ke terbaru
      .map(monthStr => ({
        month: monthStr, // Hasil contoh: "2026-07"
        revenue: monthlyDataMap[monthStr] // Total omset bulan tersebut
      }));

    // 5. Kirimkan seluruh paket data visualisasi ke Front-end
    res.json({
      success: true,
      summary: {
        totalEvents,
        totalTicketsSold,
        totalRevenue
      },
      chartData // Data krusial siap pakai untuk grafik bar/line chart
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Gagal memuat data statistik dashboard.', details: error.message });
  }
});
