export default function PremiumComparisonTable() {
  const rows = [
    ["Itinerary previews", "1 preview", "Unlimited"],
    ["Full itinerary unlock", "—", "Included"],
    ["Downloadable PDF", "—", "Included"],
    ["Budget calculator", "Basic", "Advanced"],
    ["Route optimizer", "—", "Included"],
    ["Offline mode", "—", "Included"],
    ["Safety timer", "Limited", "Live + risk scoring"],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/10">
          <tr>
            <th className="px-4 py-3">Feature</th>
            <th className="px-4 py-3">Free</th>
            <th className="px-4 py-3">Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-white/10">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3 text-slate-200">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
