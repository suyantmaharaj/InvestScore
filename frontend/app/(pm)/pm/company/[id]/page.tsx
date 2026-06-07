export default function PMCompanyDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Company Detail</h1>
      <p className="text-muted-foreground mt-2">ID: {params.id} — Coming soon.</p>
    </div>
  );
}
