// pages/dashboard.js
import { getSession, useSession } from "next-auth/react";
import clientPromise from "../lib/mongodb";
import Link from 'next/link';

export default function Dashboard({ reports }) {
  const { data: session } = useSession();
  if (!session) return <p>You must be signed in to view this page.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Your SWOT Analysis Reports</h1>
      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-4 rounded shadow">
              <p>
                <strong>Business Info:</strong> {report.businessInfo}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(report.createdAt).toLocaleString()}
              </p>
              <Link href={`/report/${report._id}`}>
                <a className="text-blue-600 underline">View Report</a>
              </Link>
              {session.user.premium && (
                <a 
                  href={`/api/generate-report?reportId=${report._id}`} 
                  className="ml-4 text-purple-600 underline"
                >
                  Download PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fetch the user’s reports on the server side.
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: '/api/auth/signin', permanent: false },
    };
  }
  try {
    const client = await clientPromise;
    const db = client.db("swotDB");
    const reports = await db.collection("reports")
      .find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    // Serialize MongoDB ObjectIds and Dates for Next.js.
    const reportsSerialized = reports.map(report => ({
      ...report,
      _id: report._id.toString(),
      createdAt: report.createdAt.toISOString(),
    }));

    return { props: { reports: reportsSerialized } };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { props: { reports: [] } };
  }
}
