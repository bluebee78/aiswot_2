// pages/api/analyze-swot.js
import { getSession } from "next-auth/react";
import clientPromise from "../../lib/mongodb";
import { Configuration, OpenAIApi } from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessInfo } = req.body;
  if (!businessInfo) {
    return res.status(400).json({ error: 'Business information is required.' });
  }

  // Ensure the user is signed in.
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Determine analysis detail based on user membership.
  const isPremium = session.user?.premium || false;
  const prompt = isPremium
    ? `Provide a detailed SWOT analysis for the following business. Include in-depth insights and custom branding recommendations in the Opportunities and Threats sections.

Business Details: ${businessInfo}`
    : `Provide a basic, concise SWOT analysis for the following business.

Business Details: ${businessInfo}`;

  // Initialize OpenAI API
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert business consultant." },
        { role: "user", content: prompt }
      ],
    });

    // Retrieve the AI response text.
    const aiResponse = completion.data.choices[0].message.content;

    // Naively parse the response for SWOT sections.
    const strengthsMatch = aiResponse.match(/Strengths:\s*(.*?)(?=Weaknesses:|Opportunities:|Threats:|$)/is);
    const weaknessesMatch = aiResponse.match(/Weaknesses:\s*(.*?)(?=Strengths:|Opportunities:|Threats:|$)/is);
    const opportunitiesMatch = aiResponse.match(/Opportunities:\s*(.*?)(?=Strengths:|Weaknesses:|Threats:|$)/is);
    const threatsMatch = aiResponse.match(/Threats:\s*(.*?)(?=Strengths:|Weaknesses:|Opportunities:|$)/is);

    const strengths = strengthsMatch ? strengthsMatch[1].trim() : "N/A";
    const weaknesses = weaknessesMatch ? weaknessesMatch[1].trim() : "N/A";
    const opportunities = opportunitiesMatch ? opportunitiesMatch[1].trim() : "N/A";
    const threats = threatsMatch ? threatsMatch[1].trim() : "N/A";

    // Save the report to MongoDB.
    const client = await clientPromise;
    const db = client.db("swotDB");
    const report = {
      userEmail: session.user.email,
      businessInfo,
      strengths,
      weaknesses,
      opportunities,
      threats,
      createdAt: new Date(),
      premium: isPremium,
    };

    const result = await db.collection("reports").insertOne(report);

    return res.status(200).json({ 
      strengths, 
      weaknesses, 
      opportunities, 
      threats, 
      reportId: result.insertedId 
    });
  } catch (error) {
    console.error("Error generating SWOT analysis:", error);
    return res.status(500).json({ error: 'Failed to generate SWOT analysis.' });
  }
}
