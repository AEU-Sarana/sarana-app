interface PageProps {
  params: { id: string }
}

export default function CashierReceiptPage({ params }: PageProps) {
  return (
    <main>
      <h1>Receipt {params.id}</h1>
      <p>Receipt detail placeholder page.</p>
    </main>
  )
}
