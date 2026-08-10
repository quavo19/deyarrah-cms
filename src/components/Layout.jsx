import { memo } from "react"
import Sidebar from "./Sidebar"

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50 flex p-2">
      <Sidebar />
      <main className="flex-1 overflow-auto">
          {children}
      </main>
    </div>
  )
}

export default memo(Layout)
