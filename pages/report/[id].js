// pages/report/[id].js
import { getSession } from "next-auth/react";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default function ReportPage({ report }) {
  if (!report) return <p>Report not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">SWOT Analysis Report</h1>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Business Info:</strong> {report.businessInfo}</p>
        <p><strong>Strengths:</strong> {report.strengths}</p>
        <p><strong>Weaknesses:</strong> {report.weaknesses}</p>
        <p><strong>Opportunities:</strong> {report.opportunities}</p>
        <p><strong>Threats:</strong> {report.threats}</p>
        <p><strong>Created At:</strong> {new Date(report.createdAt).toLocaleString()}</p>
      </div>
      {report.premium && (
        <div className="mt-4">
          <a 
            href={`/api/generate-report?reportId=${report._id}`} 
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Download PDF Report
          </a>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: '/api/auth/signin', permanent: false },
    };
  }
  const { id } = context.params;
  try {
    const client = await clientPromise;
    const db = client.db("swotDB");
    const report = await db.collection("reports").findOne({ _id: new ObjectId(id) });
    if (!report) return { notFound: true };

    // Serialize fields.
    report._id = report._id.toString();
    report.createdAt = report.createdAt.toISOString();

    return { props: { report } };
  } catch (error) {
    console.error("Error fetching report:", error);
    return { notFound: true };
  }
}
