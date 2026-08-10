import { Navigate } from 'react-router-dom'

const Inventory = () => {
  // Redirect to products index
  return <Navigate to="/inventory/products" replace />
}

export default Inventory
