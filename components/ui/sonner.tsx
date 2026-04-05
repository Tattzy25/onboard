import { Toaster as Sonner, type ToasterProps } from "sonner"
import { SystemAlert } from "./alert"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: true,
      }}
      {...props}
    />
  )
}

export { Toaster }
