import React from "react";
import ReportMap from "../views/ReportMap";

const sampleReports = [
  {
    _id: "1",
    severity: 4,
    description: "Bus overspeeding",
    issueCategory: { name: "Unsafe Driving" },
    location: {
      latitude: 23.8103,
      longitude: 90.4125,
      upazila: "Mirpur",
      district: "Dhaka"
    }
  },
  {
    _id: "2",
    severity: 2,
    description: "Broken traffic signal",
    issueCategory: { name: "Traffic Signal" },
    location: {
      latitude: 23.7806,
      longitude: 90.407,
      upazila: "Tejgaon",
      district: "Dhaka"
    }
  },
  {
    _id: "3",
    severity: 3,
    description: "Illegal parking",
    issueCategory: { name: "Illegal Parking" },
    location: {
      latitude: 23.7509,
      longitude: 90.393,
      upazila: "Dhanmondi",
      district: "Dhaka"
    }
  }
];

export default function MapTestPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Map Test</h1>

      {/* 🔥 THIS IS THE FIX */}
      <div
        style={{
          width: "100%",
          height: "500px", // ✅ MUST HAVE
        }}
      >
        <ReportMap reports={sampleReports} />
      </div>
    </div>
  );
}