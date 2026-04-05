import { Toaster as Sonner, type ToasterProps } from "sonner"
import { SystemAlert } from "./alert"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: true,
      }}
      content={(props) => {
        if (typeof props.toast.title !== 'string') return null;
        
        return (
          <SystemAlert
            id={props.toast.id as string}
            variant={props.toast.type === 'error' ? 'error' : props.toast.type === 'success' ? 'success' : props.toast.type === 'warning' ? 'warning' : 'info'}
            title={props.toast.title as string}
            description={props.toast.description as string}
            isVisible={true}
            onClose={() => props.onClose()}
            autoDismiss={5}
          />
        );
      }}
      {...props}
    />
  )
}

export { Toaster }
