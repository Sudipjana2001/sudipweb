import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Order } from "@/hooks/useOrders";

/* ─── colour tokens ─── */
const NAVY = "#1a2744";
const TEAL = "#2a7886";
const MUTED = "#6b7280";
const LIGHT_GRAY = "#e5e7eb";
const TAX_RATE = 0.08;


/* ─── helpers ─── */
const formatMoney = (amount: number) => {
  const numericAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
const safeNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/* ─── styles ─── */
const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 0,
    fontSize: 10,
    color: NAVY,
    fontFamily: "Helvetica",
    position: "relative",
  },

  /* header */
  title: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  companyName: { fontSize: 11, marginTop: 2 },
  companyAddr: { fontSize: 9, color: MUTED, lineHeight: 1.4 },

  /* info row: bill-to / ship-to / invoice meta */
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 16,
  },
  addrCol: { width: 150 },
  addrLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  addrText: { fontSize: 9, lineHeight: 1.5, color: NAVY },
  metaCol: { width: 200 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    fontWeight: 700,
    letterSpacing: 0.6,
    color: NAVY,
  },
  metaValue: { fontSize: 9, color: NAVY },

  /* divider */
  divider: {
    height: 2,
    backgroundColor: TEAL,
    marginTop: 8,
    marginBottom: 0,
  },

  /* table */
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: TEAL,
    backgroundColor: "#f3f7f8",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  colQty: { width: 50, fontSize: 9, textAlign: "center" },
  colDesc: { flexGrow: 1, flexBasis: 0, fontSize: 9, paddingLeft: 10 },
  colUnit: { width: 110, fontSize: 9, textAlign: "right" },
  colAmt: { width: 100, fontSize: 9, textAlign: "right", paddingRight: 4 },
  thText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    fontWeight: 700,
    letterSpacing: 0.6,
    color: NAVY,
  },

  /* totals */
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 260 },
  totalsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  totalsLabel: { fontSize: 10, color: MUTED },
  totalsValue: { fontSize: 10, color: NAVY },
  totalsBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: NAVY,
  },
  totalLabelBold: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    fontWeight: 700,
    color: NAVY,
  },
  totalValueBold: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    fontWeight: 700,
    color: NAVY,
  },

  /* thank you */
  thankYouWrap: {
    marginTop: 40,
    alignItems: "center",
  },
  thankYou: {
    fontSize: 28,
    fontFamily: "Times-BoldItalic",
    color: NAVY,
    letterSpacing: 0.3,
  },
  thankYouSub: {
    marginTop: 6,
    fontSize: 10,
    color: MUTED,
  },
});

/* ─── Main component ─── */
export function InvoicePdf({ order }: { order: Order }) {
  const invoiceNumber = `INV-${order.order_number}`;
  const invoiceDate = formatDate(order.created_at);
  const dueDate = formatDate(
    new Date(new Date(order.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  );

  const billTo = order.billing_address || order.shipping_address;
  const shipTo = order.shipping_address;
  const items = order.items || [];

  const subtotal = safeNumber(order.subtotal);
  const tax = safeNumber(order.tax);
  const total = safeNumber(order.total);
  const giftWrapCost = order.gift_wrap ? safeNumber(order.gift_wrap_price) : 0;

  const couponUses = order.coupon_uses || [];
  const couponDiscountFromDb = round2(
    couponUses.reduce((sum, cu) => sum + safeNumber(cu.discount_applied), 0),
  );
  const couponCode = couponUses.length > 0 ? couponUses[0]?.coupon?.code || null : null;

  const derivedTaxableAmount = TAX_RATE > 0 ? tax / TAX_RATE : 0;
  const derivedDiscount = round2(Math.max(0, subtotal + giftWrapCost - derivedTaxableAmount));
  const discount = couponDiscountFromDb > 0 ? couponDiscountFromDb : derivedDiscount;

  const gstRate = TAX_RATE * 100;
  const showGstRate = tax > 0 && Number.isFinite(gstRate);

  return (
    <Document title={`Invoice ${invoiceNumber}`}>
      <Page size="A4" style={s.page}>
        {/* ── HEADER ─────────────────────────────── */}
        <Text style={s.title}>INVOICE</Text>
        <Text style={s.companyName}>Pebric</Text>
        <Text style={s.companyAddr}>New York, NY 10001</Text>
        <Text style={s.companyAddr}>hello@pebric.com</Text>

        {/* ── BILL TO / SHIP TO / INVOICE META ──── */}
        <View style={s.infoSection}>
          {/* Bill To */}
          <View style={s.addrCol}>
            <Text style={s.addrLabel}>BILL TO</Text>
            <Text style={s.addrText}>{billTo?.full_name || "Customer"}</Text>
            {!!billTo?.address && <Text style={s.addrText}>{billTo.address}</Text>}
            {(billTo?.city || billTo?.postal_code) && (
              <Text style={s.addrText}>
                {billTo?.city || ""}{billTo?.city && billTo?.postal_code ? ", " : ""}{billTo?.postal_code || ""}
              </Text>
            )}
            <Text style={s.addrText}>{billTo?.country || "India"}</Text>
          </View>

          {/* Ship To */}
          <View style={s.addrCol}>
            <Text style={s.addrLabel}>SHIP TO</Text>
            <Text style={s.addrText}>{shipTo?.full_name || "Customer"}</Text>
            {!!shipTo?.address && <Text style={s.addrText}>{shipTo.address}</Text>}
            {(shipTo?.city || shipTo?.postal_code) && (
              <Text style={s.addrText}>
                {shipTo?.city || ""}{shipTo?.city && shipTo?.postal_code ? ", " : ""}{shipTo?.postal_code || ""}
              </Text>
            )}
            <Text style={s.addrText}>{shipTo?.country || "India"}</Text>
          </View>

          {/* Invoice metadata */}
          <View style={s.metaCol}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>INVOICE #</Text>
              <Text style={s.metaValue}>{invoiceNumber}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>INVOICE DATE</Text>
              <Text style={s.metaValue}>{invoiceDate}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>P.O.#</Text>
              <Text style={s.metaValue}>—</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>DUE DATE</Text>
              <Text style={s.metaValue}>{dueDate}</Text>
            </View>
          </View>
        </View>

        {/* ── DIVIDER ────────────────────────────── */}
        <View style={s.divider} />

        {/* ── TABLE HEADER ───────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colQty]}>QTY</Text>
          <Text style={[s.thText, s.colDesc]}>DESCRIPTION</Text>
          <Text style={[s.thText, s.colUnit]}>UNIT PRICE</Text>
          <Text style={[s.thText, s.colAmt]}>AMOUNT</Text>
        </View>

        {/* ── TABLE ROWS ─────────────────────────── */}
        {items.length === 0 ? (
          <View style={s.tableRow}>
            <Text style={s.colQty}>—</Text>
            <Text style={s.colDesc}>No items found for this order.</Text>
            <Text style={s.colUnit} />
            <Text style={s.colAmt} />
          </View>
        ) : (
          items.map((item) => {
            const variant =
              item.size || item.pet_size
                ? ` • ${item.size || ""}${item.size && item.pet_size ? " / " : ""}${item.pet_size || ""}`
                : "";
            return (
              <View key={item.id} style={s.tableRow}>
                <Text style={s.colQty}>{item.quantity}</Text>
                <Text style={s.colDesc}>
                  {item.product_name}
                  {variant}
                </Text>
                <Text style={s.colUnit}>{formatMoney(safeNumber(item.unit_price))}</Text>
                <Text style={s.colAmt}>{formatMoney(safeNumber(item.total_price))}</Text>
              </View>
            );
          })
        )}

        {/* ── TOTALS ─────────────────────────────── */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalsLine}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{formatMoney(subtotal)}</Text>
            </View>

            {discount > 0 ? (
              <View style={s.totalsLine}>
                <Text style={s.totalsLabel}>
                  {couponCode ? `Discount (${couponCode})` : "Discount"}
                </Text>
                <Text style={s.totalsValue}>- {formatMoney(discount)}</Text>
              </View>
            ) : null}

            {order.gift_wrap ? (
              <View style={s.totalsLine}>
                <Text style={s.totalsLabel}>Gift wrap</Text>
                <Text style={s.totalsValue}>{formatMoney(safeNumber(order.gift_wrap_price))}</Text>
              </View>
            ) : null}

            <View style={s.totalsLine}>
              <Text style={s.totalsLabel}>Shipping</Text>
              <Text style={s.totalsValue}>{formatMoney(safeNumber(order.shipping_cost))}</Text>
            </View>

            <View style={s.totalsLine}>
              <Text style={s.totalsLabel}>
                {showGstRate ? `GST ${gstRate.toFixed(1)}%` : "Tax"}
              </Text>
              <Text style={s.totalsValue}>{formatMoney(tax)}</Text>
            </View>
            {order.payment_method?.toLowerCase() === "cod" && (
              <View style={s.totalsLine}>
                <Text style={s.totalsLabel}>COD Fee</Text>
                <Text style={s.totalsValue}>{formatMoney(11)}</Text>
              </View>
            )}

            <View style={s.totalsBold}>
              <Text style={s.totalLabelBold}>TOTAL</Text>
              <Text style={s.totalValueBold}>Rs. {formatMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── THANK YOU ─────────────────────────── */}
        <View style={s.thankYouWrap}>
          <Text style={s.thankYou}>Thank you</Text>
          <Text style={s.thankYouSub}>For any queries, contact support@pebric.com</Text>
        </View>
      </Page>
    </Document>
  );
}
