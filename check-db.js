const { PrismaClient } = require('@prisma/client');

async function check() {
  const p = new PrismaClient();
  const events = await p.event.count();
  const tickets = await p.ticketType.count();
  const vouchers = await p.voucher.count();
  const users = await p.user.count();
  console.log(`Events: ${events}, TicketTypes: ${tickets}, Vouchers: ${vouchers}, Users: ${users}`);
  
  const sample = await p.event.findFirst({
    select: { name: true, date: true, time: true, location: true },
    orderBy: { date: 'asc' }
  });
  console.log(`Sample: ${sample?.name} | Date: ${sample?.date} | Time: ${sample?.time} | Location: ${sample?.location}`);
  
  await p.disconnect();
}

check();