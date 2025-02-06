// pages/api/generate-report.js
import { getSession } from "next-auth/react";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { jsPDF } from "jspdf";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure the user is signed in and is a premium member.
  const session = await getSession({ req });
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  if (!session.user.premium) return res.status(403).json({ error: 'Premium membership required.' });

  const { reportId } = req.query;
  if (!reportId) return res.status(400).json({ error: 'Report ID is required.' });

  try {
    // Retrieve the report from MongoDB.
    const client = await clientPromise;
    const db = client.db("swotDB");
    const report = await db
      .collection("reports")
      .findOne({ _id: new ObjectId(reportId) });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Create a new PDF document.
    const doc = new jsPDF();
    // Add custom branding and premium details.
    doc.setFontSize(18);
    doc.text("Premium SWOT Analysis Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Business Details: ${report.businessInfo}`, 20, 40);
    doc.text("Strengths:", 20, 60);
    doc.text(report.strengths, 20, 70);
    doc.text("Weaknesses:", 20, 90);
    doc.text(report.weaknesses, 20, 100);
    doc.text("Opportunities:", 20, 120);
    doc.text(report.opportunities, 20, 130);
    doc.text("Threats:", 20, 150);
    doc.text(report.threats, 20, 160);

    // Export the PDF as an ArrayBuffer.
    const pdfData = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=swot_report.pdf");
    res.send(Buffer.from(pdfData));
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({ error: 'Failed to generate PDF report.' });
  }
}
