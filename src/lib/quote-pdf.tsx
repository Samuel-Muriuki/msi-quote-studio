import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

// =============================================================
// Brand-aligned PDF stylesheet (Industrial Slate)
// =============================================================
//
// We avoid loading custom fonts in Phase 0 — react-pdf's bundled Helvetica
// renders cleanly and keeps cold-start times tight on Vercel functions.
// Phase 1.3 (settings / branding) will optionally swap to brand fonts.

Font.registerHyphenationCallback((word) => [word]); // no hyphenation

const SLATE_900 = "#0F172A";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748B";
const SLATE_100 = "#F1F5F9";
const SLATE_50 = "#F8FAFC";
const AMBER_600 = "#D97706";
const BORDER = "#E2E8F0";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: SLATE_900,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wordmarkText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  wordmarkAccent: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: AMBER_600,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 8,
    color: SLATE_500,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  quoteNumberBlock: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  documentTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    letterSpacing: 0.4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  partyBlock: {
    flexDirection: "row",
    gap: 24,
    marginTop: 24,
  },
  partyColumn: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    color: SLATE_500,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: SLATE_600,
  },
  table: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: SLATE_500,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  itemDescription: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  itemSub: {
    fontSize: 9,
    color: SLATE_600,
    marginTop: 2,
  },
  numeric: {
    fontFamily: "Courier",
    fontSize: 10,
    color: SLATE_900,
  },
  totalsBlock: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  totalsTable: {
    width: 220,
    backgroundColor: SLATE_50,
    borderRadius: 4,
    padding: 12,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: SLATE_600,
  },
  totalsValue: {
    fontFamily: "Courier",
    fontSize: 10,
    color: SLATE_900,
  },
  totalsRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  totalsLabelGrand: {
    fontSize: 11,
    color: SLATE_900,
    fontFamily: "Helvetica-Bold",
  },
  totalsValueGrand: {
    fontFamily: "Courier-Bold",
    fontSize: 12,
    color: AMBER_600,
  },
  aiCallout: {
    marginTop: 22,
    padding: 14,
    backgroundColor: SLATE_50,
    borderLeftWidth: 3,
    borderLeftColor: AMBER_600,
    borderRadius: 2,
  },
  aiCalloutLabel: {
    fontSize: 8,
    color: AMBER_600,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  aiCalloutBody: {
    fontSize: 9.5,
    color: SLATE_900,
    lineHeight: 1.5,
  },
  termsBlock: {
    marginTop: 24,
  },
  termsLabel: {
    fontSize: 8,
    color: SLATE_500,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  termsBody: {
    fontSize: 9,
    color: SLATE_600,
    lineHeight: 1.5,
  },
  signatureBlock: {
    marginTop: 32,
    flexDirection: "row",
    gap: 32,
  },
  signatureColumn: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: SLATE_900,
    marginTop: 28,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: SLATE_500,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: SLATE_500,
    paddingTop: 10,
    borderTopWidth: 0.6,
    borderTopColor: BORDER,
  },
});

// =============================================================
// Data shape & helpers
// =============================================================

export type QuotePdfLineItem = {
  description: string;
  subDescription?: string; // e.g., "Aluminum 0.020", 4 × 1.5 in"
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type QuotePdfData = {
  quoteNumber: string;
  status: string;
  createdAt: Date;
  validUntil?: Date;

  fromCompanyName: string;
  fromAddress?: string[];
  fromEmail?: string;

  toCustomerName: string;
  toCompany?: string;
  toAddress?: string[];
  toEmail?: string;

  items: QuotePdfLineItem[];
  subtotal: number;
  taxRatePct?: number;
  total: number;

  aiRationale?: string;
  aiSuggestedRange?: { low: number; high: number };
  aiComplexityScore?: number | null;

  terms?: string;
};

const dollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateLong = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  draft:    { bg: SLATE_100, fg: SLATE_600 },
  sent:     { bg: "#DBEAFE", fg: "#1D4ED8" },
  accepted: { bg: "#D1FAE5", fg: "#047857" },
  declined: { bg: "#FEE2E2", fg: "#B91C1C" },
  expired:  { bg: SLATE_100, fg: SLATE_500 },
};

// =============================================================
// Document
// =============================================================

export function QuotePdfDocument(props: { data: QuotePdfData }) {
  const { data } = props;
  const tone = STATUS_TONES[data.status] ?? STATUS_TONES.draft;
  const lastIdx = data.items.length - 1;

  return (
    <Document
      title={`Quote ${data.quoteNumber}`}
      author={data.fromCompanyName}
      subject={`Quotation for ${data.toCustomerName}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>MSI</Text>
            <Text style={styles.wordmarkAccent}>Quote</Text>
            <Text style={styles.wordmarkText}>Studio</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Quotation #</Text>
            <Text style={styles.metaValue}>{data.quoteNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Issued</Text>
            <Text style={styles.metaValue}>{dateLong.format(data.createdAt)}</Text>
            {data.validUntil && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 8 }]}>Valid until</Text>
                <Text style={styles.metaValue}>{dateLong.format(data.validUntil)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Title row */}
        <View style={styles.quoteNumberBlock}>
          <Text style={styles.documentTitle}>QUOTATION</Text>
          <Text
            style={[
              styles.statusPill,
              { backgroundColor: tone.bg, color: tone.fg },
            ]}
          >
            {data.status}
          </Text>
        </View>

        {/* Quote-by / Quote-to */}
        <View style={styles.partyBlock}>
          <View style={styles.partyColumn}>
            <Text style={styles.partyLabel}>Quote by</Text>
            <Text style={styles.partyName}>{data.fromCompanyName}</Text>
            {data.fromAddress?.map((line, i) => (
              <Text key={i} style={styles.partyLine}>{line}</Text>
            ))}
            {data.fromEmail && <Text style={styles.partyLine}>{data.fromEmail}</Text>}
          </View>
          <View style={styles.partyColumn}>
            <Text style={styles.partyLabel}>Quote to</Text>
            <Text style={styles.partyName}>{data.toCustomerName}</Text>
            {data.toCompany && <Text style={styles.partyLine}>{data.toCompany}</Text>}
            {data.toAddress?.map((line, i) => (
              <Text key={i} style={styles.partyLine}>{line}</Text>
            ))}
            {data.toEmail && <Text style={styles.partyLine}>{data.toEmail}</Text>}
          </View>
        </View>

        {/* Line item table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={i === lastIdx ? styles.tableRowLast : styles.tableRow}>
              <View style={styles.colDescription}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                {item.subDescription && (
                  <Text style={styles.itemSub}>{item.subDescription}</Text>
                )}
              </View>
              <Text style={[styles.numeric, styles.colQty]}>
                {item.quantity.toLocaleString()}
              </Text>
              <Text style={[styles.numeric, styles.colUnit]}>
                {dollar.format(item.unitPrice)}
              </Text>
              <Text style={[styles.numeric, styles.colTotal]}>
                {dollar.format(item.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{dollar.format(data.subtotal)}</Text>
            </View>
            {data.taxRatePct !== undefined && data.taxRatePct > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({data.taxRatePct}%)</Text>
                <Text style={styles.totalsValue}>
                  {dollar.format(data.total - data.subtotal)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRowGrand}>
              <Text style={styles.totalsLabelGrand}>Total</Text>
              <Text style={styles.totalsValueGrand}>{dollar.format(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* AI rationale callout */}
        {data.aiRationale && (
          <View style={styles.aiCallout}>
            <Text style={styles.aiCalloutLabel}>
              AI complexity{data.aiComplexityScore !== null && data.aiComplexityScore !== undefined ? ` · ${data.aiComplexityScore}/10` : ""}
              {data.aiSuggestedRange
                ? ` · suggested ${dollar.format(data.aiSuggestedRange.low)} – ${dollar.format(data.aiSuggestedRange.high)}`
                : ""}
            </Text>
            <Text style={styles.aiCalloutBody}>{data.aiRationale}</Text>
          </View>
        )}

        {/* Terms */}
        {data.terms && (
          <View style={styles.termsBlock}>
            <Text style={styles.termsLabel}>Terms &amp; conditions</Text>
            <Text style={styles.termsBody}>{data.terms}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorised by · {data.fromCompanyName}</Text>
          </View>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Accepted by · {data.toCustomerName}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>MSI Quote Studio · Portfolio case study by Samuel Muriuki</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
