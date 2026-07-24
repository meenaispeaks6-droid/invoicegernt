import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Invoice as DBInvoice } from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import { format } from "date-fns";
import { X } from "lucide-react";

interface CanvasInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  fromName: string;
  items: { description: string; details: string; quantity: number; price: number; amount: number }[];
  subtotal: number;
  total: number;
  status: string;
  x: number;
  y: number;
}

interface InfiniteCanvasProps {
  invoices: DBInvoice[];
  onInvoiceClick?: (invoice: DBInvoice) => void;
  statusFilter?: string | null;
  onResetFilter?: () => void;
}

// Card dimensions
const CARD_WIDTH = 280;
const CARD_HEIGHT = 364; // 8.5/11 aspect ratio
const MIN_SPACING = 40; // Minimum gap between cards

// Seeded random number generator for consistent layouts
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Generate a numeric hash from a string (invoice ID)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Check if a new position overlaps with any existing positions
function hasCollision(
  newPos: { x: number; y: number },
  existing: { x: number; y: number }[],
  minDistX: number,
  minDistY: number
): boolean {
  for (const pos of existing) {
    const dx = Math.abs(newPos.x - pos.x);
    const dy = Math.abs(newPos.y - pos.y);
    if (dx < minDistX && dy < minDistY) {
      return true;
    }
  }
  return false;
}

// Generate organic scattered layout using invoice IDs for deterministic positioning
function generateLayoutFromIds(invoiceIds: string[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (invoiceIds.length === 0) return positions;
  
  const minDistX = CARD_WIDTH + MIN_SPACING;
  const minDistY = CARD_HEIGHT + MIN_SPACING;
  const placedPositions: { x: number; y: number }[] = [];
  
  // Sort IDs to ensure consistent ordering (oldest first based on UUID timestamp or creation order)
  const sortedIds = [...invoiceIds].sort();
  
  sortedIds.forEach((id, index) => {
    const random = seededRandom(hashString(id));
    
    if (index === 0) {
      // First card at center
      const pos = { x: 0, y: 0 };
      positions.set(id, pos);
      placedPositions.push(pos);
      return;
    }
    
    let placed = false;
    let attempts = 0;
    const maxAttempts = 200;
    
    while (!placed && attempts < maxAttempts) {
      // Tight radius that grows slowly - keeps cards close
      const baseRadius = 150 + Math.sqrt(index) * 180;
      const radiusVariation = (random() - 0.3) * baseRadius * 0.5;
      const radius = Math.max(minDistX * 0.8, baseRadius + radiusVariation);
      
      // Irregular angle distribution based on index for spread
      const goldenAngle = index * 137.508 * (Math.PI / 180);
      const angleJitter = (random() - 0.5) * 1.2;
      const angle = goldenAngle + angleJitter;
      
      // Moderate jitter for organic feel
      const jitterX = (random() - 0.5) * 120;
      const jitterY = (random() - 0.5) * 100;
      
      const newPos = {
        x: Math.cos(angle) * radius + jitterX,
        y: Math.sin(angle) * radius * 0.85 + jitterY,
      };
      
      if (!hasCollision(newPos, placedPositions, minDistX, minDistY)) {
        positions.set(id, newPos);
        placedPositions.push(newPos);
        placed = true;
      }
      
      attempts++;
    }
    
    // Fallback placement - guaranteed no overlap
    if (!placed) {
      const ring = Math.ceil(Math.sqrt(index));
      const angleInRing = (index + random() * 0.5) * (Math.PI * 2 / Math.max(6, ring * 3));
      const ringRadius = ring * minDistX * 0.9;
      
      let fallbackPos = {
        x: Math.cos(angleInRing) * ringRadius + (random() - 0.5) * 60,
        y: Math.sin(angleInRing) * ringRadius * 0.85 + (random() - 0.5) * 50,
      };
      
      // Ensure fallback doesn't collide either
      let fallbackAttempts = 0;
      while (hasCollision(fallbackPos, placedPositions, minDistX, minDistY) && fallbackAttempts < 50) {
        const expandedRadius = ringRadius + fallbackAttempts * 50;
        fallbackPos = {
          x: Math.cos(angleInRing + fallbackAttempts * 0.3) * expandedRadius,
          y: Math.sin(angleInRing + fallbackAttempts * 0.3) * expandedRadius * 0.85,
        };
        fallbackAttempts++;
      }
      
      positions.set(id, fallbackPos);
      placedPositions.push(fallbackPos);
    }
  });
  
  return positions;
}

function CanvasInvoiceCard({ 
  invoice, 
  onHover, 
  isHovered,
  onClick,
}: { 
  invoice: CanvasInvoice; 
  onHover: (id: string | null) => void;
  isHovered: boolean;
  mousePosition: { x: number; y: number };
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform3D, setTransform3D] = useState({ rotateX: 0, rotateY: 0 });
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateY = ((e.clientX - centerX) / rect.width) * 15;
    const rotateX = ((centerY - e.clientY) / rect.height) * 15;
    
    setTransform3D({ rotateX, rotateY });
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setTransform3D({ rotateX: 0, rotateY: 0 });
    onHover(null);
  }, [onHover]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      ref={cardRef}
      className="absolute cursor-pointer select-none"
      style={{
        left: invoice.x,
        top: invoice.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: isHovered 
          ? `perspective(1000px) rotateX(${transform3D.rotateX}deg) rotateY(${transform3D.rotateY}deg) scale(1.05) translateZ(20px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)',
        transition: isHovered ? 'none' : 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        zIndex: isHovered ? 100 : 1,
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => onHover(invoice.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div 
        className="w-full h-full bg-white rounded-sm overflow-hidden flex flex-col"
        style={{
          boxShadow: isHovered 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            : '0 10px 30px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Geist Mono Variable', 'Geist', monospace",
        }}
      >
        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2
                className="text-lg font-bold text-black tracking-tight"
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                INVOICE
              </h2>
              <p className="text-[10px] text-gray-500 tracking-wider mt-0.5">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[8px] text-gray-400 tracking-wider uppercase mb-1">
                BILL TO
              </p>
              <p className="text-[11px] font-semibold text-black">
                {invoice.clientName}
              </p>
              <p className="text-[8px] text-gray-500">{invoice.clientEmail}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-[8px] text-gray-400 tracking-wider uppercase">
                  ISSUE DATE
                </p>
                <p className="text-[10px] font-medium text-black">
                  {invoice.invoiceDate.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-gray-400 tracking-wider uppercase">
                  DUE DATE
                </p>
                <p className="text-[10px] font-medium text-black">
                  {invoice.dueDate.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />

          {/* Line Items Table */}
          <div className="flex-1">
            <div className="flex justify-between text-[8px] text-gray-400 border-b border-gray-100 pb-1 mb-1.5">
              <span className="tracking-wider uppercase">Description</span>
              <span className="tracking-wider uppercase">Amount</span>
            </div>
            {invoice.items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-700 truncate max-w-[140px]">
                  {item.description}
                </span>
                <span className="text-gray-600 font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            {invoice.items.length > 3 && (
              <p className="text-[8px] text-gray-400 italic">
                +{invoice.items.length - 3} more items
              </p>
            )}
            {invoice.items.length === 0 && (
              <p className="text-[8px] text-gray-300 text-center py-2 uppercase tracking-wider">
                NO ITEMS
              </p>
            )}
          </div>

          {/* Total */}
          <div className="mt-auto pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Total
              </span>
              <span className="text-[10px] text-black">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InfiniteCanvas({ invoices, onInvoiceClick, statusFilter, onResetFilter }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.45);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const lastMouse = useRef({ x: 0, y: 0, time: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const animationRef = useRef<number>();
  const { data: settings } = useSettings();
  
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2;
  
  // Generate layout based on invoice IDs - recalculates when invoices change
  const invoiceIds = useMemo(() => invoices.map(inv => inv.id), [invoices]);
  const layoutMap = useMemo(() => generateLayoutFromIds(invoiceIds), [invoiceIds]);
  
  // Check if we're in filtered mode
  const isFiltered = !!statusFilter;
  
  // Transform DB invoices to canvas format
  const canvasInvoices: CanvasInvoice[] = invoices.map((inv) => {
    const pos = layoutMap.get(inv.id) || { x: 0, y: 0 };
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: format(new Date(inv.issue_date), "d MMMM, yyyy"),
      dueDate: inv.due_date ? format(new Date(inv.due_date), "d MMMM, yyyy") : "—",
      clientName: inv.clients?.name || "Unknown Client",
      clientEmail: inv.clients?.email || "",
      fromName: settings?.company_name || `${settings?.first_name || ""} ${settings?.last_name || ""}`.trim() || "Your Company",
      items: inv.invoice_items?.map(item => ({
        description: item.description,
        details: "",
        quantity: item.quantity,
        price: item.unit_price,
        amount: item.amount,
      })) || [],
      subtotal: inv.subtotal,
      total: inv.total,
      status: inv.status,
      x: pos.x,
      y: pos.y,
    };
  });
  
  // Filter invoices based on status
  const filteredInvoices = isFiltered 
    ? canvasInvoices.filter(inv => inv.status === statusFilter)
    : canvasInvoices;
  
  // Generate horizontal stack positions for filtered view
  const getStackPosition = (index: number, total: number) => {
    const spacing = CARD_WIDTH + 30;
    const totalWidth = (total - 1) * spacing;
    const startX = -totalWidth / 2;
    return {
      x: startX + index * spacing,
      y: 0,
    };
  };
  
  // Calculate the center point of all invoices
  const invoicesCenter = useMemo(() => {
    if (canvasInvoices.length === 0) return { x: 0, y: 0 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    canvasInvoices.forEach((inv) => {
      minX = Math.min(minX, inv.x);
      maxX = Math.max(maxX, inv.x + CARD_WIDTH);
      minY = Math.min(minY, inv.y);
      maxY = Math.max(maxY, inv.y + CARD_HEIGHT);
    });
    
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  }, [canvasInvoices]);
  
  // Track if initial centering has been done
  const hasInitiallyCentered = useRef(false);
  
  // Center the canvas on the middle of all scattered invoices (only on initial load)
  useEffect(() => {
    if (containerRef.current && canvasInvoices.length > 0 && !hasInitiallyCentered.current) {
      const container = containerRef.current;
      const viewportCenterX = container.clientWidth / 2;
      const viewportCenterY = container.clientHeight / 2;
      
      // Position so that the invoices' center appears at the viewport center
      setPosition({
        x: viewportCenterX - invoicesCenter.x * scale,
        y: viewportCenterY - invoicesCenter.y * scale,
      });
      hasInitiallyCentered.current = true;
    }
  }, [canvasInvoices.length, invoicesCenter, scale]);
  
  // Inertia animation
  useEffect(() => {
    if (isDragging) return;
    
    const animate = () => {
      setVelocity(prev => {
        const friction = 0.95;
        const newVel = { x: prev.x * friction, y: prev.y * friction };
        
        if (Math.abs(newVel.x) < 0.1 && Math.abs(newVel.y) < 0.1) {
          return { x: 0, y: 0 };
        }
        
        setPosition(pos => ({
          x: pos.x + newVel.x,
          y: pos.y + newVel.y,
        }));
        
        return newVel;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, velocity.x, velocity.y]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (hoveredId) return; // Don't drag when hovering a card
    
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    lastMouse.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, [position, hoveredId]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    setPosition({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy,
    });
    
    // Track velocity for inertia
    const now = Date.now();
    const dt = now - lastMouse.current.time;
    if (dt > 0) {
      setVelocity({
        x: (e.clientX - lastMouse.current.x) / dt * 16,
        y: (e.clientY - lastMouse.current.y) / dt * 16,
      });
    }
    lastMouse.current = { x: e.clientX, y: e.clientY, time: now };
  }, [isDragging]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Touch support for mobile - panning and pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setVelocity({ x: 0, y: 0 });
      dragStart.current = { x: touch.clientX, y: touch.clientY, posX: position.x, posY: position.y };
      lastMouse.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  }, [position]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default to stop browser scroll/zoom interference
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = distance - lastTouchDistance.current;
      
      setScale(prev => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta * 0.005)));
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      
      setPosition({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
      
      const now = Date.now();
      const dt = now - lastMouse.current.time;
      if (dt > 0) {
        setVelocity({
          x: (touch.clientX - lastMouse.current.x) / dt * 16,
          y: (touch.clientY - lastMouse.current.y) / dt * 16,
        });
      }
      lastMouse.current = { x: touch.clientX, y: touch.clientY, time: now };
    }
  }, [isDragging]);
  
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = null;
  }, []);
  
  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    
    // Zoom toward mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleChange = newScale / scale;
      const newPosX = mouseX - (mouseX - position.x) * scaleChange;
      const newPosY = mouseY - (mouseY - position.y) * scaleChange;
      
      setPosition({ x: newPosX, y: newPosY });
    }
    
    setScale(newScale);
  }, [scale, position]);

  // Determine the effective scale for filtered view
  const effectiveScale = isFiltered ? 0.55 : scale;
  
  // Center position for filtered view
  const getFilteredPosition = () => {
    if (!containerRef.current) return position;
    const container = containerRef.current;
    return {
      x: container.clientWidth / 2,
      y: container.clientHeight / 2 - CARD_HEIGHT / 4,
    };
  };
  
  const displayPosition = isFiltered ? getFilteredPosition() : position;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ cursor: isFiltered ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
      onMouseDown={isFiltered ? undefined : handleMouseDown}
      onMouseMove={isFiltered ? undefined : handleMouseMove}
      onMouseUp={isFiltered ? undefined : handleMouseUp}
      onMouseLeave={isFiltered ? undefined : handleMouseLeave}
      onTouchStart={isFiltered ? undefined : handleTouchStart}
      onTouchMove={isFiltered ? undefined : handleTouchMove}
      onTouchEnd={isFiltered ? undefined : handleTouchEnd}
      onWheel={isFiltered ? undefined : handleWheel}
    >
      {/* Canvas content */}
      <div
        className="absolute"
        style={{
          transform: `translate3d(${displayPosition.x}px, ${displayPosition.y}px, 0) scale(${effectiveScale})`,
          willChange: 'transform',
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.5s ease-out',
        }}
      >
        {canvasInvoices.map((invoice) => {
          const isVisible = !isFiltered || invoice.status === statusFilter;
          const filteredIndex = filteredInvoices.findIndex(inv => inv.id === invoice.id);
          const stackPos = isFiltered && isVisible 
            ? getStackPosition(filteredIndex, filteredInvoices.length)
            : { x: invoice.x, y: invoice.y };
          
          const originalInvoiceIndex = invoices.findIndex(inv => inv.id === invoice.id);
          
          return (
            <div
              key={invoice.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                left: stackPos.x,
                top: stackPos.y,
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                transform: `translate(-${CARD_WIDTH / 2}px, -${CARD_HEIGHT / 2}px)`,
              }}
            >
              <CanvasInvoiceCard
                invoice={{ ...invoice, x: 0, y: 0 }}
                onHover={setHoveredId}
                isHovered={hoveredId === invoice.id}
                mousePosition={mousePosition}
                onClick={() => onInvoiceClick?.(invoices[originalInvoiceIndex])}
              />
            </div>
          );
        })}
      </div>
      
      {/* Subtle grid pattern - only show when not filtered */}
      {!isFiltered && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${100 * scale}px ${100 * scale}px`,
            backgroundPosition: `${position.x % (100 * scale)}px ${position.y % (100 * scale)}px`,
            willChange: 'background-position',
            transition: isDragging ? 'none' : 'background-position 0.5s ease-out',
          }}
        />
      )}
      
      {/* Helper text - only show when not filtered */}
      {!isFiltered && (
        <div className="absolute bottom-4 left-4 text-white/40 text-xs pointer-events-none">
          DRAG CANVAS
        </div>
      )}
      
      {/* Zoom indicator - only show when not filtered */}
      {!isFiltered && (
        <div className="absolute bottom-4 right-4 text-white/40 text-xs pointer-events-none flex items-center gap-2">
          <span>SCROLL TO ZOOM</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
      )}
      
      {/* Filtered status indicator with reset */}
      {isFiltered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <span className="text-white/50 text-xs uppercase tracking-widest">
            Showing {filteredInvoices.length} {statusFilter} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={onResetFilter}
            className="flex items-center gap-1.5 text-white text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <span>Reset</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
