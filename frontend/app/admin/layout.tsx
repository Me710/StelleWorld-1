export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  // Ce template wrap les pages admin SANS le root layout
  return <>{children}</>
}
