import { useState } from "react";
import { InvoiceCard, Invoice } from "./InvoiceCard";

// Mock data for recent invoices
const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-0022",
    invoiceDate: "06 MAR 2026",
    dueDate: "07 MAR 2026",
    clientName: "Thomas Mars",
    clientEmail: "hello@thomas.com",
    clientCompany: "Mars Design Co",
    items: [
      { description: "Website Design", quantity: 5, price: 1000, amount: 5000 },
      { description: "Logo Design", quantity: 1, price: 5000, amount: 5000 },
    ],
    subtotal: 10000,
    total: 10000,
  },
  {
    id: "2",
    invoiceNumber: "INV-0021",
    invoiceDate: "05 MAR 2026",
    dueDate: "06 MAR 2026",
    clientName: "Sarah Chen",
    clientEmail: "sarah@chen.com",
    clientCompany: "Chen Studios",
    items: [
      { description: "Brand Identity", quantity: 1, price: 8000, amount: 8000 },
    ],
    subtotal: 8000,
    total: 8000,
  },
  {
    id: "3",
    invoiceNumber: "INV-0020",
    invoiceDate: "04 MAR 2026",
    dueDate: "05 MAR 2026",
    clientName: "Alex Rivera",
    clientEmail: "alex@rivera.io",
    clientCompany: "Rivera Labs",
    items: [
      { description: "Mobile App UI", quantity: 1, price: 15000, amount: 15000 },
    ],
    subtotal: 15000,
    total: 15000,
  },
  {
    id: "4",
    invoiceNumber: "INV-0019",
    invoiceDate: "03 MAR 2026",
    dueDate: "04 MAR 2026",
    clientName: "Emma Wilson",
    clientEmail: "emma@wilson.co",
    clientCompany: "Wilson & Co",
    items: [
      { description: "Marketing Site", quantity: 1, price: 6000, amount: 6000 },
    ],
    subtotal: 6000,
    total: 6000,
  },
  {
    id: "5",
    invoiceNumber: "INV-0018",
    invoiceDate: "02 MAR 2026",
    dueDate: "03 MAR 2026",
    clientName: "James Park",
    clientEmail: "james@park.dev",
    clientCompany: "Park Development",
    items: [
      { description: "Dashboard Design", quantity: 1, price: 12000, amount: 12000 },
    ],
    subtotal: 12000,
    total: 12000,
  },
];

// Card positions in a fan layout (from left to right, rightmost on top)
const cardConfigs = [
  { x: -320, y: 60, rotate: -15, zIndex: 5 },
  { x: -160, y: 30, rotate: -8, zIndex: 4 },
  { x: 0, y: 0, rotate: 0, zIndex: 3 },
  { x: 160, y: 30, rotate: 8, zIndex: 2 },
  { x: 320, y: 60, rotate: 15, zIndex: 1 },
];

export function RecentInvoicesStack() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative flex items-center justify-center" style={{ height: "450px" }}>
      {mockInvoices.map((invoice, index) => {
        const config = cardConfigs[index];
        const isHovered = hoveredIndex === index;
        
        return (
          <div
            key={invoice.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              transform: `
                translateX(${config.x}px) 
                translateY(${isHovered ? config.y - 40 : config.y}px) 
                rotate(${isHovered ? 0 : config.rotate}deg)
                scale(${isHovered ? 1.05 : 1})
              `,
              zIndex: isHovered ? 100 : config.zIndex,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <InvoiceCard
              invoice={invoice}
              className={`transition-shadow duration-300 ${
                isHovered ? "shadow-2xl" : "shadow-lg"
              }`}
              style={{
                position: "relative",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
