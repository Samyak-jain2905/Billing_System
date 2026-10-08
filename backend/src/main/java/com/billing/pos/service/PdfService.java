package com.billing.pos.service;

import com.billing.pos.model.Invoice;
import com.billing.pos.model.InvoiceItem;
import com.billing.pos.model.ShopSettings;
import com.billing.pos.repository.ShopSettingsRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final ShopSettingsRepository shopSettingsRepository;

    public byte[] generateThermalReceipt(Invoice invoice) {
        ShopSettings settings = shopSettingsRepository.findById(1L).orElseGet(() -> {
            ShopSettings s = new ShopSettings();
            s.setShopName("SUPERMART RETAIL");
            s.setAddress("123 Market Street");
            s.setPhone("9876543210");
            s.setGstin("22AAAAA0000A1Z5");
            s.setFooterMessage("Thank You! Visit Again");
            return s;
        });

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        // 80mm thermal paper width is approx 226 points
        Rectangle pagesize = new Rectangle(226, 800);
        Document document = new Document(pagesize, 10, 10, 10, 10);
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            // Header
            Paragraph shopName = new Paragraph(settings.getShopName() != null ? settings.getShopName() : "SHOP", titleFont);
            shopName.setAlignment(Element.ALIGN_CENTER);
            document.add(shopName);

            String addr = (settings.getAddress() != null ? settings.getAddress() : "") + 
                         "\nPh: " + (settings.getPhone() != null ? settings.getPhone() : "") + 
                         (settings.getGstin() != null ? "\nGSTIN: " + settings.getGstin() : "");
            
            Paragraph address = new Paragraph(addr, smallFont);
            address.setAlignment(Element.ALIGN_CENTER);
            document.add(address);
            
            document.add(new Paragraph("--------------------------------------------------", smallFont));
            
            Paragraph title = new Paragraph("TAX INVOICE", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            document.add(new Paragraph("Bill No: " + invoice.getInvoiceNumber(), regularFont));
            document.add(new Paragraph("Date: " + invoice.getInvoiceDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")), regularFont));
            if (invoice.getCustomer() != null) {
                document.add(new Paragraph("Customer: " + invoice.getCustomer().getName() + " (" + invoice.getCustomer().getMobile() + ")", regularFont));
            }
            document.add(new Paragraph("--------------------------------------------------", smallFont));

            // Items Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 1f, 2f, 2f});
            
            addTableCell(table, "Item", headerFont, Element.ALIGN_LEFT);
            addTableCell(table, "Qty", headerFont, Element.ALIGN_CENTER);
            addTableCell(table, "Rate", headerFont, Element.ALIGN_RIGHT);
            addTableCell(table, "Amt", headerFont, Element.ALIGN_RIGHT);

            for (InvoiceItem item : invoice.getItems()) {
                addTableCell(table, item.getProduct().getName(), regularFont, Element.ALIGN_LEFT);
                addTableCell(table, String.valueOf(item.getQuantity()), regularFont, Element.ALIGN_CENTER);
                addTableCell(table, item.getRate().toString(), regularFont, Element.ALIGN_RIGHT);
                addTableCell(table, item.getTotalAmount().toString(), regularFont, Element.ALIGN_RIGHT);
            }
            document.add(table);
            
            document.add(new Paragraph("--------------------------------------------------", smallFont));

            // Totals
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            totalsTable.setWidths(new float[]{3f, 1f});
            
            addTableCell(totalsTable, "Subtotal:", regularFont, Element.ALIGN_RIGHT);
            addTableCell(totalsTable, invoice.getSubtotal().toString(), regularFont, Element.ALIGN_RIGHT);
            
            addTableCell(totalsTable, "GST:", regularFont, Element.ALIGN_RIGHT);
            addTableCell(totalsTable, invoice.getTotalGst().toString(), regularFont, Element.ALIGN_RIGHT);

            addTableCell(totalsTable, "GRAND TOTAL:", headerFont, Element.ALIGN_RIGHT);
            addTableCell(totalsTable, invoice.getGrandTotal().toString(), headerFont, Element.ALIGN_RIGHT);
            
            document.add(totalsTable);

            document.add(new Paragraph("--------------------------------------------------", smallFont));
            
            Paragraph payment = new Paragraph("Paid via: " + invoice.getPaymentMethod(), regularFont);
            payment.setAlignment(Element.ALIGN_CENTER);
            document.add(payment);

            Paragraph footer = new Paragraph(settings.getFooterMessage() != null ? settings.getFooterMessage() : "Thank You!", headerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return out.toByteArray();
    }

    private void addTableCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }
}
