import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function DataCleanser() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [profile, setProfile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const content = evt.target.result;
      let parsed;
      if (file.name.endsWith(".csv")) {
        parsed = Papa.parse(content, { header: false }).data;
      } else {
        const wb = XLSX.read(content, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json(ws, { header: 1 });
      }
      const [header, ...rows] = parsed;
      setColumns(header);
      setData(rows);
      computeProfile(header, rows);
    };

    reader.readAsBinaryString(file);
  };

  const cleanseData = () => {
    const cleaned = data
      .map((row) => row.map((cell) => (typeof cell === "string" ? cell.trim() : cell)))
      .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""));

    setData(cleaned);
    computeProfile(columns, cleaned);
  };

  const computeProfile = (cols, rows) => {
    const profileSummary = cols.map((col, idx) => {
      const colData = rows.map((row) => row[idx]);
      const nonEmpty = colData.filter((v) => v !== null && v !== undefined && v !== "");
      const uniqueValues = new Set(nonEmpty.map((v) => v.toString().toLowerCase()));
      const isNumeric = nonEmpty.every((v) => !isNaN(parseFloat(v)));
      let stats = {};
      if (isNumeric) {
        const nums = nonEmpty.map((v) => parseFloat(v));
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const stdDev = Math.sqrt(
          nums.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / nums.length
        );
        stats = { mean, stdDev, min: Math.min(...nums), max: Math.max(...nums) };
      }
      return {
        column: col,
        completeness: (nonEmpty.length / rows.length) * 100,
        uniqueness: uniqueValues.size,
        isNumeric,
        stats,
      };
    });
    setProfile(profileSummary);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">🧹 Data Cleanser Web App</h1>

      <Card>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          <Button onClick={cleanseData}>Cleanse Data</Button>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">📊 Data Profile Summary</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Column</TableCell>
                  <TableCell>Completeness %</TableCell>
                  <TableCell>Uniqueness</TableCell>
                  <TableCell>Is Numeric</TableCell>
                  <TableCell>Stats</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{p.column}</TableCell>
                    <TableCell>{p.completeness.toFixed(2)}%</TableCell>
                    <TableCell>{p.uniqueness}</TableCell>
                    <TableCell>{p.isNumeric ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {p.isNumeric && `Mean: ${p.stats.mean.toFixed(2)}, SD: ${p.stats.stdDev.toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">📋 Cleaned Data Preview</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col, i) => (
                    <TableCell key={i} className="font-bold">
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell?.toString()}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
