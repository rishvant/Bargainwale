import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import axios from "axios";
import { getPricesByWarehouse } from "@/services/itemService";
import {
  formatDate,
  numberToWords,
  toTitleCase,
  roundOff,
} from "../../utils/helper.js";
import { API_BASE_URL } from "@/services/api";

const orgId = localStorage.getItem("clerk_active_org");
const fetchResponse = async () => {
  const response2 = await axios.get(`${API_BASE_URL}/organization/${orgId}`);
  return response2;
};
const response = fetchResponse();

const SalesInvoice = forwardRef(({ sale }, ref) => {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const organization = response.data;

  useEffect(() => {
    if (sale?.sales) {
      const newItems = [];
      let subtotal = 0;
      let totalTax = 0;
      let grandTotal = 0;

      for (const saleDocument of sale.sales) {
        let saleItems = saleDocument.items.map((item, index) => {
          let itemPrice = 0;
          let taxPerUnit = 0;
          let totalAmount = 0;

          for (const bookingItem of saleDocument.bookingId?.items || []) {
            if (bookingItem.item?._id === item.itemId?._id) {
              itemPrice = bookingItem.basePrice;
              taxPerUnit = (item.itemId?.gst / 100) * itemPrice;
              totalAmount = item.quantity * (itemPrice + taxPerUnit);
            }
          }

          subtotal += item.quantity * itemPrice;
          totalTax += item.quantity * taxPerUnit;
          grandTotal += totalAmount;

          return {
            index: index + 1,
            description: item.itemId?.materialdescription || "N/A",
            hsnCode: item.hsnCode || "N/A",
            quantity: item.quantity,
            price: itemPrice.toFixed(2),
            gst: item.itemId?.gst || 0,
            totalAmount: totalAmount.toFixed(2),
            taxPerUnit: taxPerUnit.toFixed(2),
          };
        });
        newItems.push(...saleItems);
      }
      setGrandTotal(grandTotal);
      setSubtotal(subtotal);
      setTotalTax(totalTax);
      setItems(newItems);
    }
  }, [sale]);

  const roundOff2 = (value) => {
    return Math.round(value * 100) / 100;
  };

  const handleDownloadPDF = (saleId) => {
    const element = document.getElementById(saleId);
    element.style.visibility = "visible";
    html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      logging: false,
      height: element.scrollHeight + 400,
      windowHeight: element.scrollHeight + 400,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", [210, 350]);
      const pdfWidth = 210;
      const pdfHeight = 297;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const aspectRatio = canvasHeight / canvasWidth;

      const imgWidth = pdfWidth - 20;
      const imgHeight = imgWidth * aspectRatio;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      pdf.save(`invoice_${sale?._id}.pdf`);
    });

    element.style.visibility = "hidden";
  };

  useImperativeHandle(ref, () => ({
    handleDownloadPDF,
  }));

  return (
    <>
      <button
        onClick={() => handleDownloadPDF(sale._id)}
        className="bg-blue-500 text-white py-2 px-4 rounded mb-4 h-20"
      >
        Download as PDF
      </button>
      <div
        id={sale._id}
        className={`${sale._id} invoice-container max-w-3xl bg-white mx-auto p-6 shadow-lg border border-gray-300 overflow-auto max-h-[90vh]`}
      >
        <h1 className="text-2xl font-bold text-center">Tax Invoice</h1>
        <header className="flex justify-between border-b-2 pb-2 mb-6">
          <div className="flex flex-col items-start space-y-2">
            <p>
              IRN: <strong>{sale?.irn || "N/A"}</strong>
            </p>
            <p>
              Ack No.: <strong>{sale?.ackNumber || "N/A"}</strong>
            </p>
            <p>
              Ack Date:{" "}
              <strong>{formatDate(sale?.invoiceDate) || "N/A"}</strong>
            </p>
          </div>
        </header>
        <div className="flex justify-between border-2 px-4 mb-6">
          <section className="flex-2 pr-4">
            <div className="border-b-2 pb-4 text-left">
              <h2 className="font-bold text-lg">{organization?.name}</h2>
              <p>{organization?.address?.line1},</p>
              <p>{organization?.address?.line2},</p>
              <p>
                <strong>GSTIN:</strong> {organization?.gstin}
              </p>
              <p>
                {organization?.address?.city}, {organization?.address?.state},{" "}
                {organization?.address?.pincode}
              </p>
            </div>
            <section className="mt-4 pr-2">
              {["consignee", "buyer"].map((party) => (
                <div className="pb-4 text-left" key={party}>
                  <h3 className="font-semibold text-lg">
                    {party.charAt(0).toUpperCase() + party.slice(1)}
                  </h3>
                  <h4>{sale?.sales[0]?.bookingId?.buyer?.buyer}</h4>
                  <p>
                    {sale?.sales[0]?.bookingId?.buyer?.buyerdeliveryAddress
                      ?.addressLine1 || ""}
                  </p>
                  <p>
                    {sale?.sales[0]?.bookingId?.buyer?.buyerdeliveryAddress
                      ?.addressLine2 || ""}
                  </p>
                  <p>
                    {sale?.sales[0]?.bookingId?.buyer?.buyerdeliveryAddress
                      ?.city || ""}
                    ,{" "}
                    {sale?.sales[0]?.bookingId?.buyer?.buyerdeliveryAddress
                      ?.state || ""}
                  </p>
                  <p>
                    PIN:{" "}
                    {sale?.sales[0]?.bookingId?.buyer?.buyerdeliveryAddress
                      ?.pinCode || "N/A"}
                  </p>
                </div>
              ))}
            </section>
          </section>
          <div className="flex-1 ml-0 border-l-2">
            <table className="w-full table-auto mb-2">
              <tbody>
                <tr>
                  <td className="border px-4 py-2">Invoice No:</td>
                  <td className="border px-4 py-2">
                    {sale?.invoiceNumber || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Date:</td>
                  <td className="border px-4 py-2">
                    {formatDate(sale?.invoiceDate)}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Challan No.:</td>
                  <td className="border px-4 py-2">
                    {sale?.challanNo || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Supplier's Ref:</td>
                  <td className="border px-4 py-2">{sale?.supRef || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Other Reference:</td>
                  <td className="border px-4 py-2">{sale?.otRef || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Booking No.:</td>
                  <td className="border px-4 py-2">{sale?.ordNo || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Transporter:</td>
                  <td className="border px-4 py-2">
                    {sale?.transporterId?.transport || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="pl-4 text-left">Terms Of Delivery: </div>
          </div>
        </div>

        <table className="w-full table-auto mb-6">
          <thead>
            <tr>
              <th className="border px-4 py-2">Sr. No.</th>
              <th className="border px-4 py-2">Description of Goods</th>
              <th className="border px-4 py-2">HSN/SAC</th>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Rate (₹)</th>
              <th className="border px-4 py-2">GST (%)</th>
              <th className="border px-4 py-2">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{item.index}</td>
                <td className="border px-4 py-2">{item.description}</td>
                <td className="border px-4 py-2">{item.hsnCode}</td>
                <td className="border px-4 py-2">{item.quantity}</td>
                <td className="border px-4 py-2">{item.price}</td>
                <td className="border px-4 py-2">{item.gst}%</td>
                <td className="border px-4 py-2">{item.totalAmount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="border text-right px-4 py-2">
                Total
              </td>
              <td className="border px-4 py-2">{subtotal.toFixed(2)}</td>
              <td className="border px-4 py-2">
                {totalTax.toFixed(2)} (CGST + SGST)
              </td>
              <td className="border px-4 py-2">{grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Updated Summary Section */}
        <section className="text-left">
          <p>
            <strong>Total Taxable Value:</strong> ₹{subtotal.toFixed(2)}
          </p>
          <p>
            <strong>CGST + SGST:</strong> ₹{totalTax.toFixed(2)}
          </p>
          <p>
            <strong>Total:</strong> ₹{grandTotal.toFixed(2)}
          </p>
          <p>
            <strong>Round Off:</strong> ₹
            {roundOff2(grandTotal - Math.round(grandTotal))}
          </p>
          <p>
            <strong>Grand Total:</strong> ₹{grandTotal.toFixed(0)}
          </p>
          <p>
            <strong>Amount (in words):</strong>{" "}
            {"Rs. " + Math.round(grandTotal).toLocaleString() + " Only"}
          </p>
        </section>

        <footer className="text-center text-sm text-gray-600 border-t pt-4">
          <p>
            <strong>Declaration:</strong> Certified that all the particulars
            above are true.
          </p>
          <p>
            <strong>Company's PAN:</strong> {organization?.fssai || "N/A"}
          </p>
          <p className="italic">
            This is a computer-generated invoice. Date & Time of Printing:{" "}
            {new Date().toLocaleString()}
          </p>
        </footer>
      </div>
    </>
  );
});

export default SalesInvoice;
