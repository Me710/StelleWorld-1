'use client'

const demoOrders = [
  { id: 1, order_number: 'ST-20251217-A1B2', user_name: 'Marie Dupont', status: 'confirmed', total_amount: 329.98, total_items: 2 },
  { id: 2, order_number: 'ST-20251216-C3D4', user_name: 'Sophie Martin', status: 'shipped', total_amount: 189.99, total_items: 3 },
  { id: 3, order_number: 'ST-20251215-E5F6', user_name: 'Julie Bernard', status: 'delivered', total_amount: 249.97, total_items: 4 },
]

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestion des Commandes</h1>
        <p className="text-gray-600 mb-6">Total: {demoOrders.length} commandes</p>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {demoOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{order.order_number}</td>
                  <td className="px-6 py-4">{order.user_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{order.total_amount.toFixed(2)}€</td>
                  <td className="px-6 py-4">{order.total_items} articles</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
